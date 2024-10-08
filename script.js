(function () {
    // Real implementation of Spin methods
    var accountId;
    var visitorId;
    var cookieName = "sf_vid";
    var apiUrl = "https://api.spinfiliate.com/event";
    var queue = [];  // Queue to hold the functions
    var isProcessing = false;  // Flag to indicate if the queue is being processed

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null; // Return null if the cookie is not found
    }

    function setCookie(name, value, days = 365, path = '/') {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

        // Get the current hostname
        const hostname = window.location.hostname;

        // Determine if we're on the main domain or a subdomain
        const domainParts = hostname.split('.');
        let domainAttribute = '';

        if (domainParts.length > 2) {
            // It's a subdomain, do not set the domain attribute
            domainAttribute = '';
        } else {
            // It's the main domain, set the domain attribute
            domainAttribute = `; domain=.${domainParts.slice(-2).join('.')}`;
        }

        // Set the cookie
        document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=${path}${domainAttribute}`;
    }

    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    async function httpRequest(url, method = 'GET', data = null, headers = {}, params = {}) {
        try {
            // Handle query parameters for GET requests
            if (params && Object.keys(params).length > 0) {
                const urlParams = new URLSearchParams(params).toString();
                url += `?${urlParams}`;
            }

            const options = {
                method: method.toUpperCase(), // Ensure method is always uppercase
                headers: {
                    'Content-Type': 'application/json',
                    ...headers // Spread additional headers if provided
                }
            };

            if (data && method !== 'GET') {
                options.body = JSON.stringify(data); // Add body data if it's not a GET request
            }

            const response = await fetch(url, options);

            // Check if the response is okay (status in the range 200-299)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            throw error; // Rethrow the error after logging it
        }
    }

    function enqueue(fn) {
        queue.push(fn);  // Add the function to the queue
        if (!isProcessing) {
            processQueue();  // Start processing the queue if not already processing
        }
    }

    async function processQueue() {
        if (queue.length === 0) {
            isProcessing = false;  // Set processing flag to false if queue is empty
            return;
        }

        isProcessing = true;
        const fn = queue.shift();  // Get the first function from the queue
        await fn();  // Execute the function
        processQueue();  // Process the next function in the queue
    }

    function create(accId, options, callback) {
        enqueue(async () => {
            accountId = accId;

            const existingVid = getCookie(cookieName);
            if (existingVid) {
                visitorId = existingVid;
            }
            callback && callback();
        });
    }

    function detect(options = {}, callback) {
        enqueue(async () => {
            const referralCodeParam = options["referral_code_param"] || "ref";
            if (referralCodeParam) {
                const referralCode = getQueryParam(referralCodeParam);
                if (referralCode) {
                    const params = {
                        "acc": accountId,
                        "refc": referralCode
                    };
                    try {
                        const data = await httpRequest(`${apiUrl}/visitor/`, 'GET', null, {}, params);
                        setCookie(cookieName, data.vid);
                        visitorId = data.vid;
                        callback && callback(null, data);
                    } catch (error) {
                        callback && callback(error, null);
                    }
                } else {
                    callback && callback("Referral code not found", null);
                }
            }
        });
    }

    function customer(customerId, options = {}, callback) {
        enqueue(async () => {
            if (!visitorId) {
                const error = "Visitor id not found";
                callback && callback(error, null);
                return;
            }
            if (!customerId) {
                const error = "Customer id not found";
                callback && callback(error, null);
                return;
            }
            const data = {
                "acc": accountId,
                "vid": visitorId,
                "customer_id": customerId,
                "options": options
            };
            try {
                const response = await httpRequest(`${apiUrl}/customer/`, 'POST', data, {}, {});
                callback && callback(null, response);
            } catch (error) {
                callback && callback(error, null);
            }
        });
    }

    function conversion(conversionId, amount, options = {}, callback) {
        enqueue(async () => {
            if (!visitorId) {
                const error = "Visitor id not found";
                callback && callback(error, null);
                return;
            }
            if (!conversionId) {
                const error = "Conversion id not found";
                callback && callback(error, null);
                return;
            }

            const data = {
                "acc": accountId,
                "vid": visitorId,
                "tid": conversionId,
                "amount": amount || null,
                "options": options
            };
            try {
                const response = await httpRequest(`${apiUrl}/conversion/`, 'POST', data, {}, {});
                callback && callback(null, response);
            } catch (error) {
                callback && callback(error, null);
            }
        });
    }

    // Replace the stub function with the real Spin implementation
    window.spin = {
        create,
        detect,
        customer,
        conversion
    };

    // Process any queued commands
    if (window.Spin.q && window.Spin.q.length > 0) {
        // First, find and execute the "create" method, if it exists
        const createIndex = window.Spin.q.findIndex(function (args) {
            return args[0] === "create";
        });

        if (createIndex !== -1) {
            const createArgs = window.Spin.q.splice(createIndex, 1)[0];
            const methodArgs = Array.prototype.slice.call(createArgs, 1);

            if (typeof window.spin.create === "function") {
                window.spin.create.apply(null, methodArgs);
            }
        }

        // Process the remaining queued commands in the order they were queued
        window.Spin.q.forEach(function (args) {
            const method = args[0];
            const methodArgs = Array.prototype.slice.call(args, 1);

            if (method !== "create" && typeof window.spin[method] === "function") {
                window.spin[method].apply(null, methodArgs);
            }
        });

        // Clear the queue after processing
        window.Spin.q = [];
    }
})();
