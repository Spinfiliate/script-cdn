(function () {
    var t = window;

    // Check if spin is already defined
    if (typeof t.spin === "function") return;

    // Create a stub function for spin
    var spin = function () {
        spin.q = spin.q || [];
        spin.q.push(arguments);
    };

    // Assign the stub function to window.spin
    t.spin = spin;

    // Load the actual script
    var loadScript = function () {
        var scriptElement = document.createElement("script");
        scriptElement.type = "text/javascript";
        scriptElement.async = true;
        scriptElement.src = "https://script.spinfiliate.com/spinfiliate.js";

        var firstScript = document.getElementsByTagName("script")[0];
        firstScript.parentNode.insertBefore(scriptElement, firstScript);
    };

    // Load the script once the document is ready
    if (document.readyState === "complete") {
        loadScript();
    } else {
        t.attachEvent ? t.attachEvent("onload", loadScript) : t.addEventListener("load", loadScript, false);
    }
})();
