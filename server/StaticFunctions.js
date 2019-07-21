

const StaticFunctions = {
	ensureLeadingSlash: function(s){
		return s.length === 0 || s.charAt(0) === '/' 
				? s
				: '/' + s;
	},
	ensurePaddingSlash: function(s){
		return s.charAt(s.length - 1) === '/' 
					? s
					: s + '/';
	},
	eraseLeadingSlash: function(s){
		return s.length === 0 || s.charAt(0) != '/'
				? s
				: s.substr(1);
	},
	erasePaddingSlash: function(s){
		return s.length === 0 || s.charAt(s.length - 1) != '/'
				? s
				: s.substr(0, s.length-1);
	}
};

module.exports = StaticFunctions;