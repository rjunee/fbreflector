/**
 * Copyright Ryan Junee
 * http://github.com/rjunee/fbreflector
 * 
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.opensource.org/licenses/mit-license.php
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
 
function fbr_init() {
  // Dummy console if no firebug
  if(typeof console === "undefined") {
    console = { log: function() { } };
  }
  
  // Default config variables
  console.log(fbr_config);
  if (typeof fbr_config['show_comments'] == 'undefined') {
    fbr_config['show_comments'] = true;
  }
  if (typeof fbr_config['show_likes'] == 'undefined') {
    fbr_config['show_likes'] = true;
  }
  
  
  // Load feed
  if ($('div#fb-reflector').length > 0) {
    $('div#fb-reflector').empty();
    FB.api('/' + fbr_user_id + '/posts', 'get', { access_token: fbr_access_token }, parseAndDisplayFeed);
    // Request /feed instead of /posts if you want to include wall posts from others
  }
  
  // Load photos
  if ($('div#fb-photos').length > 0) {
    $('div#fb-photos').empty();
    FB.api('/' + fbr_user_id + '/photos', 'get', { access_token: fbr_access_token }, parseAndDisplayPhotos);
  }

}


// Parse and display feed returned from Facebook API call
function parseAndDisplayFeed(response) {
  // Make sure we got something back
  if (!response || !response.data) {
    console.log("Error loading feed");
    console.log(response);
    return;
  }
  
  // Remove existing paging link (if it exists)
  if ($('div#fb-reflector div.paging-link').length > 0) {
    $('div#fb-reflector div.paging-link').remove();
  }
  
  // Build each item
  for (var i = 0, l = response.data.length; i < l; i++) {
    $(buildItem(response.data[i])).hide().appendTo('div#fb-reflector').fadeIn();
  }
  
  // Add paging link if necessary
  if (response.paging && response.paging.next) {
    $("<div class='paging-link'><a href='javascript:void(0);'>Older Posts</a></div>").hide().appendTo('div#fb-reflector').fadeIn();
    var next_path = response.paging.next.replace(/https:\/\/graph.facebook.com/i, '');
    $('div#fb-reflector div.paging-link a').click(function() {
      FB.api(next_path, 'get', { access_token: fbr_access_token }, parseAndDisplayFeed);
    });
  }
}


// Parse and display comments returned from Facebook API call (when requesting additional comments)
function parseMoreComments(response, comments_div) {
  // Make sure we got something back
  if (!response || !response.data) {
    console.log("Error loading more comments");
    console.log(response);
    return;
  }
  
 comments_div.slideUp(200, function() {
    comments_div.empty();
    for (var i = 0, l = response.data.length; i < l; i++) {
      comments_div.append(buildComment(response.data[i]));
    }
    comments_div.slideDown();
  });
}


// Build HTML for a feed item represented in JSON
// TODO: Is this susceptible to script injection? Or does facebook sanitize their data?
function buildItem(item) {  
  var service = item.attribution ? item.attribution : 'Facebook';

  var html = $("<div class='feed-item'></div>");

  // Message
  var message = ""
  switch(item['type']) {
  case 'link':
  case 'status':
    message = formatMessage(item.message);
    break;
  case 'photo':
    message = buildPhotoMessage(item);
    break;
  default:
    if (item.message) {
      message = formatMessage(item.message);
    } 
  }
  html.append("<div class='message'>" + message + "</div>");
  
  // Image
  switch(item['type']) {
  case 'link':
    image = parseTwitpic(item.message);
    if (image) {
      html.append("<div class='image'><a href='" + image.url + "' target='_blank'><img src='" + image.thumb + "' alt='twitpic' width='150' height='150' /></a></div>");
      service = "TwitPic";
    }
    break;
  case 'photo':
    if (item.picture) {
      html.append("<div class='image'><a href='" + item.link + "' target='_blank'><img src='" + item.picture + "' alt='" + item.name + "' /></a></div>");
    }
    break;
  }
    
  // Metadata
  var metadata = $("<div class='metadata'></div>");
  html.append(metadata)
  metadata.append(convertDateTimeString(item.created_time) + " via " + service + " - <a href='#'>Comment</a> - <a href='#'>Like</a>");  
 
  // Likes
  if (item.likes && fbr_config['show_likes']) {
    html.append("<div class='likes'>" + item.likes + (item.likes == 1 ? " person likes " : " people like ") + "this</div>");
  }
  
  // Comments
  if (item.comments && fbr_config['show_comments']) {
    var comments_div = $("<div class='comments'></div>");
    html.append(comments_div);
    
    // Handle more comments link if necessary
    if (item.comments.count > item.comments.data.length) {
      var more_link = $("<a class='more-comments' href='javascript:void(0);'>View all " + item.comments.count + " comments</a>");
      more_link.click(function() {
        FB.api("/" + item.id + "/comments", 'get', { access_token: fbr_access_token }, function(response) {
          parseMoreComments(response, more_link.parent('div.comments'));
        });
      });
      comments_div.append(more_link);
    }
    
    // Add included comments
    for (var i = 0, l = item.comments.data.length; i < l; i++) {
      $(buildComment(item.comments.data[i])).hide().appendTo(comments_div).fadeIn();
    }
  }   

  return html; 
}


// Build HTML for a comment represented in JSON
function buildComment(comment) {
  if (!comment.message) {
    return "";
  }
  
  var html = $("<div class='comment'></div>");
  
  html.append("<div class='comment-photo'><a href='http://www.facebook.com/profile.php?id=" + comment.from.id + "' target='_blank'><img src='http://graph.facebook.com/" + comment.from.id + "/picture?type=square' alt='" + comment.from.name + "' width='50' height='50' /></a></div>");
  
  var details = $("<div class='comment-details'></div");
  html.append(details);
  details.append("<div class='commenter'><a href='http://www.facebook.com/profile.php?id=" + comment.from.id + "' target='_blank'>" + comment.from.name + "</a></div>");
  details.append("<div class='comment-text'>" + formatMessage(comment.message) + "</div>");
  var metadata = $("<div class='metadata'></div>");
  details.append(metadata);
  metadata.append(convertDateTimeString(comment.created_time) + " via Facebook");
  
  return html; 
}


// Constructs message HTML for a photo item
function buildPhotoMessage(item) {
  var description;
  var album;
  
  // First line
  if (item.message) {
    description = item.message;
  } else if (item.description) {
    description = item.description;
  }
  
  // Second line
  if (item.name) {
    album = item.name;
    if (item.caption) {
      album += " (" + item.caption + ")";
    }
  } else if (item.caption) {
    album = item.caption;
  }
  if (item.link) {
    album = "<a href='" + item.link + "' target='_blank'>" + album + "</a>";
  }
  
  if (description) {
    return description + "<br />" + album;
  } else {
    return album;
  }
}



// Parse and display feed returned from Facebook API call
function parseAndDisplayPhotos(response) {
  // Make sure we got something back
  if (!response || !response.data) {
    console.log("Error loading photos");
    console.log(response);
    return;
  }
  
  // Remove existing paging link (if it exists)
  if ($('div#fb-photos div.paging-link').length > 0) {
    $('div#fb-photos div.paging-link').remove();
  }
  
  // Build each photo
  for (var i = 0, l = response.data.length; i < l; i++) {
    $(buildPhoto(response.data[i])).hide().appendTo('div#fb-photos').fadeIn();
  }
  
  // Add paging link if necessary
  if (response.paging && response.paging.next) {
    $("<div class='paging-link'><a href='javascript:void(0);'>More</a></div>").hide().appendTo('div#fb-photos').fadeIn();
    var next_path = response.paging.next.replace(/https:\/\/graph.facebook.com/i, '');
    $('div#fb-photos div.paging-link a').click(function() {
      FB.api(next_path, 'get', { access_token: fbr_access_token }, parseAndDisplayPhotos);
    });
  }
}

// Build HTML for a photo item represented in JSON
function buildPhoto(item) {
  // Figure out how to scale the thumb to consume 100x100 square
  var scaleSize = 100;
  var width = item.width;
  var height = item.height;
  var aspect = width/height;
  if (width > height) {
    height = scaleSize;
    width = height * aspect;
  } else if (height > width) {
    width = scaleSize;
    height = width/aspect;
  } else {
    width = height = scaleSize;
  }
  
  return "<div class='thumbnail'><img src='" + item.picture + "' alt='' width='" + width +"' height='" + height + "' /></div>";
}


// Takes a message string, automatically links and URLs, and replaces linebreaks with <br />
function formatMessage(message) {
  return linkify(message, {callback: linkifyNewWindow}).replace(/\n/g, '<br />');
}


// Look for twitpic links, and if found, return an object:
// {url: <link to twitpic page>, thumb: <url of image thumbnail>}
// Otherwise return false
function parseTwitpic(message) {
  //var parts = /http:\/\/twitpic.com\/([a-z0-9]+)/(message);
  var re = /http:\/\/twitpic.com\/([a-z0-9]+)/;
  var parts = re.exec(message);
  
  if (parts) {
    var image = {};
    image.url = parts[0];
    image.thumb = "http://twitpic.com/show/thumb/" + parts[1];
    return image;
  } else {
    return false;
  }
}

// Converts the datetime string supplied by facebook into something more readable, and in local time
// Input: 2010-08-03T05:57:39+0000
// Output: August 2 at 10:57pm
function convertDateTimeString(input) { 
  //var parts = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-]\d{4})/(input);
  var re = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-]\d{4})/;
  var parts = re.exec(input);
  
  utc_time = Date.UTC(parts[1], parseInt(parts[2],10)-1, parts[3], parts[4], parts[5], parts[6]); 
  date = new Date(utc_time);
  
  // Get month
  var month_names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"]; 
  var month = month_names[date.getMonth()];
  
  // Get day
  var day = date.getDate();
  
  // Get time
  var time = (date.getHours() % 12 || 12) + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() + (date.getHours() < 12 ? 'am' : 'pm');
  
  return month + " " + day + " at " + time;
}


/*
 * JavaScript Linkify - v0.3 - 6/27/2009
 * http://github.com/cowboy/javascript-linkify
 * 
 * Copyright (c) 2009 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 * 
 * Some regexps adapted from http://userscripts.org/scripts/review/7122
 */
window.linkify=(function(){var k="[a-z\\d.-]+://",h="(?:(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])\\.){3}(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])",c="(?:(?:[^\\s!@#$%^&*()_=+[\\]{}\\\\|;:'\",.<>/?]+)\\.)+",n="(?:ac|ad|aero|ae|af|ag|ai|al|am|an|ao|aq|arpa|ar|asia|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|biz|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|cat|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|coop|com|co|cr|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|edu|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gov|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|info|int|in|io|iq|ir|is|it|je|jm|jobs|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mil|mk|ml|mm|mn|mobi|mo|mp|mq|mr|ms|mt|museum|mu|mv|mw|mx|my|mz|name|na|nc|net|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|org|pa|pe|pf|pg|ph|pk|pl|pm|pn|pro|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tel|tf|tg|th|tj|tk|tl|tm|tn|to|tp|travel|tr|tt|tv|tw|tz|ua|ug|uk|um|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|xn--0zwm56d|xn--11b5bs3a9aj6g|xn--80akhbyknj4f|xn--9t4b11yi5a|xn--deba0ad|xn--g6w251d|xn--hgbk6aj7f53bba|xn--hlcj6aya9esc7a|xn--jxalpdlp|xn--kgbechtv|xn--zckzah|ye|yt|yu|za|zm|zw)",f="(?:"+c+n+"|"+h+")",o="(?:[;/][^#?<>\\s]*)?",e="(?:\\?[^#<>\\s]*)?(?:#[^<>\\s]*)?",d="\\b"+k+"[^<>\\s]+",a="\\b"+f+o+e+"(?!\\w)",m="mailto:",j="(?:"+m+")?[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@"+f+e+"(?!\\w)",l=new RegExp("(?:"+d+"|"+a+"|"+j+")","ig"),g=new RegExp("^"+k,"i"),b={"'":"`",">":"<",")":"(","]":"[","}":"{","B;":"B+","b:":"b9"},i={callback:function(q,p){return p?'<a href="'+p+'" title="'+p+'">'+q+"</a>":q},punct_regexp:/(?:[!?.,:;'"]|(?:&|&amp;)(?:lt|gt|quot|apos|raquo|laquo|rsaquo|lsaquo);)$/};return function(u,z){z=z||{};var w,v,A,p,x="",t=[],s,E,C,y,q,D,B,r;for(v in i){if(z[v]===undefined){z[v]=i[v]}}while(w=l.exec(u)){A=w[0];E=l.lastIndex;C=E-A.length;if(/[\/:]/.test(u.charAt(C-1))){continue}do{y=A;r=A.substr(-1);B=b[r];if(B){q=A.match(new RegExp("\\"+B+"(?!$)","g"));D=A.match(new RegExp("\\"+r,"g"));if((q?q.length:0)<(D?D.length:0)){A=A.substr(0,A.length-1);E--}}if(z.punct_regexp){A=A.replace(z.punct_regexp,function(F){E-=F.length;return""})}}while(A.length&&A!==y);p=A;if(!g.test(p)){p=(p.indexOf("@")!==-1?(!p.indexOf(m)?"":m):!p.indexOf("irc.")?"irc://":!p.indexOf("ftp.")?"ftp://":"http://")+p}if(s!=C){t.push([u.slice(s,C)]);s=E}t.push([A,p])}t.push([u.substr(s)]);for(v=0;v<t.length;v++){x+=z.callback.apply(window,t[v])}return x||u}})();
function linkifyNewWindow(text, href) {
  return href ? '<a href="' + href + '" title="' + href + '" target="_blank">' + text + '</a>' : text;
}