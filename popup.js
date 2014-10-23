$(function() {
	var tablink;
	chrome.tabs.getSelected(null,function(tab){
		tablink = tab.url;	
		document.getElementById("currentAddress").innerHTML = "current address is: " + tab.url;
					
		//getting settings
		chrome.storage.sync.get({
			favoriteColor: 'red',
			likesColor: true,
			defaultAction: '0'
			}, function(items) {
			defaultAction = items.defaultAction;
			color = items.favoriteColor;
			
			
			if (defaultAction==3){
				searchAndCrawl();
			} else if (defaultAction==2){
				searchOnly();
			} else if (defaultAction==1){
				crawlOnly();
			} 
		 });
		 
	});
	


	
	//=-=-=-=- helpers functions -=-=-=-=//
	// this function take a URL as input, 
	// calculate the domain from it and perform some google searches to find the career page of the domain.
	function googleSearchURL(inputURL) {
		
		//to get rid of the http://
	    var tempURL = inputURL.replace("http://", "").replace("https://","");
	
		//to cut the domain name from www.glassdoor.com/careers/teams/engineering to www.glassdoor.com
		//get the position of "/" and cut the string; if "/" not found, use the original address
		var forwardSlash = tempURL.indexOf("/");
    	var domain = tempURL.slice(0, forwardSlash);
		if (forwardSlash==-1) {
		    domain=tempURL;
		}
	
		//creating tabs with google search result about career within the domain.
		//the addresses are: https://www.google.com/search?q=~[employment|career|jobs|opportunities]+site:domain.com
		var url1  = "https://www.google.com/search?q=" + "~employment site:" + domain;
		chrome.tabs.create({url: url1});
	 
		var url2  = "https://www.google.com/search?q=" + "~careers site:" + domain;
		chrome.tabs.create({url: url2});
	 
		var url3  = "https://www.google.com/search?q=" + "~jobs site:" + domain;
		chrome.tabs.create({url: url3});
	 
		var url4  = "https://www.google.com/search?q=" + "~opportunities site:" + domain;
		chrome.tabs.create({url: url4});

	}
	
	// download HTML as string from the given address.
	// reference: 	ajaz get (JQuery function)
	//			 		http://api.jquery.com/jQuery.get/ 
	//					http://api.jquery.com/category/ajax/
	//					http://www.w3schools.com/jquery/ajax_get.asp
	//					http://api.jquery.com/jQuery.ajax/
	//				
	//				Cross-domain (CORS) request
	//					http://en.wikipedia.org/wiki/Same-origin_policy
	//					http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
	//					http://stackoverflow.com/questions/19821753/jquery-xml-error-no-access-control-allow-origin-header-is-present-on-the-req
	//					http://stackoverflow.com/questions/298745/how-do-i-send-a-cross-domain-post-request-via-javascript/23501289#23501289
	//					http://jquery-howto.blogspot.com/2013/09/jquery-cross-domain-ajax-request.html#cors
	//
	//				Cross-Origin XMLHttpRequest (chrome extensions)
	//					https://developer.chrome.com/extensions/xhr
	//
	//				return $.get 	should use ajax get request instead
	//					http://stackoverflow.com/questions/1639555/jquery-return-get-data-in-a-function
	function getHTML(inputAddress){
		var html;
	    /*$.get(inputAddress,function(rawHTML){
	    	alert rawHTML;
		});*/
		$.ajax({
			url: inputAddress,
			type: 'get',
			dataType: 'html',
			async: false,
			success: function(rawHTML) {
				html = rawHTML;
			}
		});		
		return html;
	}
	
	// this function find an <a> link in the webpage and return the href
	function returnLinkTo(keyword, fromText, inputAddress){
		// the # of space charactors that is allow in the keyword,
		// used to ignore links like "click here to our blog for more hiring employer resources"
		numberOfSpace=3;
		
		if ( keyword!=null && keyword.length >0 ){
			// get the href to keyword
			// find the index of the keyword,
			// then find the index of <a someting> by str.lastIndexOf("keyword",87); (need index of < )
			// cut <a something> keyword out by using 2 index
			// find href by match(/href="[^"]*"/g);
			
			// ****** if (keyword.match(/\s/g).length <= numberOfSpace)
			
			//alert ("DEBUG: finding: "+keyword+" from: "+inputAddress);
			
			for (var i = 0; i < keyword.length; i++) {
				
				// ignore list
				if ( keyword[i].match(/\s/g)!=null) {
					// try to ignore links like "click here to our blog for more hiring employer resources"
					if (keyword[i].match(/\s/g).length > numberOfSpace){
						continue;
					} else if (keyword[i].match(/equal/ig) != null){
						continue;		// equal opportunity employer
					}
				}
				
			
				var fromIndex=fromText.lastIndexOf("<a",fromText.indexOf(keyword[i]));
				var toIndex=fromText.indexOf(keyword[i]);
				var sitemapAddress="";
				
				//try to get the address out of the href="address.com"
				if ( fromText.substring(fromIndex,toIndex).match(/href=["'][^"']*["']/ig) != null){
					sitemapAddress=fromText.substring(fromIndex,toIndex).match(/href=["'][^"']*["']/g)[0].replace('href=','').replace(/\"/g,'').replace(/\'/g,'');
				} else if ( fromText.substring(fromIndex,toIndex).match(/href\s?=\s?[^\s]*/ig) != null) {
					
					//to handle cases that <a href =address.com id=something>
					sitemapAddress=fromText.substring(fromIndex,toIndex).match(/href\s?=\s?[^\s]*/ig)[0].replace(/href\s?=\s?/g,'').replace(/\"/g,'').replace(/\'/g,'');
					
				} else {
					
					//alert ("DEBUG: "+keyword);
					//alert ("DEBUG: "+fromText.substring(fromIndex,toIndex));
					//alert ("DEBUG: "+fromText.substring(fromIndex,toIndex).match(/href\s?=\s?[^\s]*/ig)[0].replace(/href\s?=\s?/g,''));
					//alert ("DEBUG: "+fromText.substring(fromIndex,toIndex).match(/href=["'][^"']*["']/g));
					//return "";
					continue;
				}
				
				//ignore list
				if (sitemapAddress != null){
					if (sitemapAddress[sitemapAddress.length-1] == '#'){
						continue;
					}
				}
				
				
				// add domain back into the address if necessary
				// also detect mailto: and .pdf and perform different actions
				if ( sitemapAddress.indexOf("mailto") == -1 && sitemapAddress.indexOf("http") == -1 && sitemapAddress.indexOf(".pdf") == -1 ){
					if (sitemapAddress[0] != '/'){
						sitemapAddress='/'+sitemapAddress;
					}
					return inputAddress.substring(0,inputAddress.indexOf("/",9))+sitemapAddress;
				} else if (sitemapAddress.indexOf("mailto") != -1 || sitemapAddress.indexOf(".pdf") != -1) {
					continue;
				} else {
					return sitemapAddress;
				}
			
			}
		}
		
		return "";
		
	}
	
	
	function ifCareerExist(rawHTML, inputAddress){
		
		//<div id=bshjbdjf>		\<[^\/a][^\>]*\>
		//<area>				\<a[^\s>][^\>]*\>
		//</div>				\<\/[^a][^\>]*\>
		//</area>				\<\/a[^\>][^\>]*\>
		//var rawHTML=rawHTMLOriginal.replace('/\<[^\/a][^\>]*\>/g','').replace('/\<a[^\s>][^\>]*\>/g','').replace('/\<\/[^a][^\>]*\>/g','').replace('/\<\/a[^\>][^\>]*\>/g','');
		
		
		var keyword=rawHTML.match(/\>[^<>]*Career[^<>]*\<\/a/ig);
		var link=returnLinkTo(keyword, rawHTML, inputAddress);
		if (link.length>0){
			return link;
		}
		
		var keyword=rawHTML.match(/\>[^<>]*Job[^<>]*\<\/a/ig);
		var link=returnLinkTo(keyword, rawHTML, inputAddress);
		if (link.length>0){
			return link;
		}
		
		var keyword=rawHTML.match(/\>[^<>]*Opportunit[^<>]*\<\/a/ig);
		var link=returnLinkTo(keyword, rawHTML, inputAddress);
		if (link.length>0){
			return link;
		}
		
		var keyword=rawHTML.match(/\>[^<>]*Opening[^<>]*\<\/a/ig);
		var link=returnLinkTo(keyword, rawHTML, inputAddress);
		if (link.length>0){
			return link;
		}
		
		var keyword=rawHTML.match(/\>[^<>]*Employment[^<>]*\<\/a/ig);
		var link=returnLinkTo(keyword, rawHTML, inputAddress);
		if (link.length>0){
			return link;
		}
		
		var keyword=rawHTML.match(/\>[^<>]*recruitment[^<>]*\<\/a/ig);
		var link=returnLinkTo(keyword, rawHTML, inputAddress);
		if (link.length>0){
			return link;
		}
		
		var keyword=rawHTML.match(/\>[^<>]*work for[^<>]*\<\/a/ig);
		var link=returnLinkTo(keyword, rawHTML, inputAddress);
		if (link.length>0){
			return link;
		}
		
		var keyword=rawHTML.match(/\>[^<>]*join [^\s]* team[^<>]*\<\/a/ig);
		var link=returnLinkTo(keyword, rawHTML, inputAddress);
		if (link.length>0){
			return link;
		}
		
		var keyword=rawHTML.match(/\>[^<>]*join us[^<>]*\<\/a/ig);
		var link=returnLinkTo(keyword, rawHTML, inputAddress);
		if (link.length>0){
			return link;
		}
		
		//trying to catch "Working for us"
		var keyword=rawHTML.match(/\>[^<>]?working[^<>]*\<\/a/ig);
		var link=returnLinkTo(keyword, rawHTML, inputAddress);
		if (link.length>0){
			return link;
		}
		
		//trying to catch "<a> work </a>"
		var keyword=rawHTML.match(/\>[^<>]?work[^<>]?\<\/a/ig);
		var link=returnLinkTo(keyword, rawHTML, inputAddress);
		if (link.length>0){
			return link;
		}
		
		return null;
	}
	
	
	// simple career page crawler.
	// will return 	address to the career page, or
	//				-1 if no page found.
	function simpleCrawler(inputAddress){
		// section 1, 	download the index and try to see if the website has a site map
		//				if site map present, add the site map to the rawhtml for section 2
		//				do the same for "about" "contact" "company"
		// section 2, 	Locate the career page from the rawHTML
		//				by looking at the keywords: Career|Job|Opportunit|Opening|working|Employment|recruitment|work for|>\s?work\s?<
		// var keyword=rawHTML.match(/\>[^<>]*Career[^<>]*\<\/a|\>[^<>]*Job[^<>]*\<\/a|\>[^<>]*Opportunit[^<>]*\<\/a|\>[^<>]*Opening[^<>]*\<\/a|\>[^<>]*working[^<>]*\<\/a|\>[^<>]*Employment[^<>]*\<\/a|\>[^<>]*recruitment[^<>]*\<\/a|\>[^<>]*work\sfor[^<>]*\<\/a|\>[^<>]?work[^<>]?\<\/a/i);
		var rawHTML=getHTML(inputAddress);
		
		var careerPageLink=ifCareerExist(rawHTML,inputAddress);
		if ( careerPageLink!=null ){
			return careerPageLink;
		}
		
		
		//find the keyword "sitemap" in rawHTML (index)
		// find the link, download the page and attach it back to rawHTML 
		var keyword=rawHTML.match(/\>[^<>]*site\s?map[^<>]*\<\/a/i);
		var link="";
		if ( keyword!=null && keyword.length >0 ){
			link=returnLinkTo(keyword, rawHTML, inputAddress);
		}
		if (link.length>0){
			rawHTML= rawHTML + "<!--beginning of sitemap-->" + getHTML(link);
		}
		
		var careerPageLink=ifCareerExist(rawHTML,inputAddress);
		if ( careerPageLink!=null ){
			return careerPageLink;
		}
		
		
		//this section try to attach the "ABOUT US" page to the rawHTML
		var keyword=rawHTML.match(/\>[^<>]*about[^<>]*\<\/a/i);
		var link="";
		if ( keyword!=null && keyword.length >0 ){
			link=returnLinkTo(keyword, rawHTML, inputAddress);
		}
		if (link.length>0){
			rawHTML= rawHTML + "<!--beginning of about-->" + getHTML(link);
		}
		
		var careerPageLink=ifCareerExist(rawHTML,inputAddress);
		if ( careerPageLink!=null ){
			return careerPageLink;
		}
		
		
		
		//this section try to attach the "Contact Us" page to the rawHTML
		var keyword=rawHTML.match(/\>[^<>]*contact[^<>]*\<\/a/i);
		var link="";
		if ( keyword!=null && keyword.length >0 ){
			link=returnLinkTo(keyword, rawHTML, inputAddress);
		}
		if (link.length>0){
			rawHTML= rawHTML + "<!--beginning of contact-->" + getHTML(link);
		}
		
		var careerPageLink=ifCareerExist(rawHTML,inputAddress);
		if ( careerPageLink!=null ){
			return careerPageLink;
		}
		
		
		//this section try to attach the "company" page to the rawHTML
		var keyword=rawHTML.match(/\>[^<>]*company[^<>]*\<\/a/i);
		var link="";
		if ( keyword!=null && keyword.length >0 ){
			link=returnLinkTo(keyword, rawHTML, inputAddress);
		}
		if (link.length>0){
			rawHTML= rawHTML + "<!--beginning of company-->" + getHTML(link);
		}
		
		var careerPageLink=ifCareerExist(rawHTML,inputAddress);
		if ( careerPageLink!=null ){
			return careerPageLink;
		}
		return null;
		
		//DEBUG: 	alert(rawHTML.indexOf("beginning of about")+" "+rawHTML.length);
	}
	

	//=-=-=-=- action functions -=-=-=-=//
	// the 3 functions: Crawl only, search only, and crawl and search
	// also used by the default action in afterInit function 
	function searchOnly(){
		//perform 4 google searches with the current tab address, which get in the chrome.tabs.getSelected
		googleSearchURL(tablink);
	}
	
	function crawlOnly(){
		//try to find the career page using simple crawler
		var linkToCareerPage=simpleCrawler(tablink);
		if (linkToCareerPage != null){
			//then open a tab to the career page
			chrome.tabs.create({url: linkToCareerPage});
		} else {
			//otherwise, do nothing.
			document.getElementById("currentAddress").innerHTML = "<font color=red>Crawl Failed</font>";
			document.getElementById("crawlCurrent").disabled=true;
			document.getElementById("searchCurrentWithCrawler").disabled=true;
		}
	}
		
	function searchAndCrawl(){
		//try to find the career page using simple crawler
		var linkToCareerPage=simpleCrawler(tablink);
		//if simpleCrawler return a result
		if (linkToCareerPage != null){
			//then open a tab to the career page
			chrome.tabs.create({url: linkToCareerPage});
		} else {
			//otherwise, perform 4 google searches with the current tab address, which get in the chrome.tabs.getSelected
			googleSearchURL(tablink);
		}
	}
	
	
	//=-=-=-=- listeners -=-=-=-=//
  
	$('#searchCurrent').click(function() {		
		//perform 4 google searches with the current tab address, which get in the chrome.tabs.getSelected
		//googleSearchURL(tablink);
		searchOnly();
	});
  
  	$('#crawlCurrent').click(function() {		
		//try to find the career page using simple crawler
		//var linkToCareerPage=simpleCrawler(tablink);
		//if (linkToCareerPage != null){
		//	//then open a tab to the career page
		//	chrome.tabs.create({url: linkToCareerPage});
		//} else {
		//	//otherwise, do nothing.
		//	document.getElementById("currentAddress").innerHTML = "<font color=red>Crawl Failed</font>";
		//}
		crawlOnly();
	});
  
	$('#searchCurrentWithCrawler').click(function() {		
		////try to find the career page using simple crawler
		//var linkToCareerPage=simpleCrawler(tablink);
		////if simpleCrawler return a result
		//if (linkToCareerPage != null){
		//	//then open a tab to the career page
		//	chrome.tabs.create({url: linkToCareerPage});
		//} else {
		//	//otherwise, perform 4 google searches with the current tab address, which get in the chrome.tabs.getSelected
		//	googleSearchURL(tablink);
		//}
		searchAndCrawl();
	});
  
  
});

document.addEventListener('DOMContentLoaded');