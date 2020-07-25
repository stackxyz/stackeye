// https://developer.chrome.com/extensions/tut_analytics
// https://developers.google.com/analytics/devguides/collection/gajs/eventTrackerGuide

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-168844325-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
