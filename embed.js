(function () {
    var t = window;

    // Check if Spin is already defined
    if (typeof t.Spin === "function") return;

    // Create a stub function for Spin
    var Spin = function () {
        Spin.q = Spin.q || [];
        Spin.q.push(arguments);
    };

    // Assign the stub function to window.Spin
    t.Spin = Spin;

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
