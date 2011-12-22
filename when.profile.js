var profile = (function(){
	var testRE = /^when\/test\//;
	return {
		resourceTags: {
            test: function(filename, mid){
				// Tag test files as such
                return testRE.test(mid);
            },
            amd: function(filename, mid){
				// Tag the module as AMD so it doesn't get
				// wrapped by the Dojo builder
                return mid == "when/when" || mid == "when";
            },
            copyOnly: function(filename, mid){
				// Don't process package.json
                return mid == "when/package.json";
            }
		}
	};
})();
