function fbr_init(){if(typeof console==="undefined"){console={log:function(){}}}if(typeof fbr_config.show_comments=="undefined"){fbr_config.show_comments=true}if(typeof fbr_config.show_likes=="undefined"){fbr_config.show_likes=true}if(typeof fbr_config.enable_like=="undefined"){fbr_config.enable_like=true}if(typeof fbr_config.enable_comment=="undefined"){fbr_config.enable_comment=true}if($("div#fb-reflector").length>0){$("div#fb-reflector").empty();FB.api("/"+fbr_user_id+"/posts","get",{access_token:fbr_access_token},parseAndDisplayFeed)}if($("div#fb-photos").length>0){$("div#fb-photos").empty();FB.api("/"+fbr_user_id+"/photos","get",{access_token:fbr_access_token},parseAndDisplayPhotos)}}function parseAndDisplayFeed(b){if(!b||!b.data){console.log("Error loading feed");console.log(b);return}if($("div#fb-reflector div.paging-link").length>0){$("div#fb-reflector div.paging-link").remove()}for(var c=0,a=b.data.length;c<a;c++){$(buildItem(b.data[c])).hide().appendTo("div#fb-reflector").fadeIn()}if(b.paging&&b.paging.next){$("<div class='paging-link'><a href='javascript:void(0);'>Older Posts</a></div>").hide().appendTo("div#fb-reflector").fadeIn();var d=b.paging.next.replace(/https:\/\/graph.facebook.com/i,"");$("div#fb-reflector div.paging-link a").click(function(){FB.api(d,"get",{access_token:fbr_access_token},parseAndDisplayFeed)})}}function parseMoreComments(b,a){if(!b||!b.data){console.log("Error loading more comments");console.log(b);return}a.slideUp(200,function(){a.empty();for(var d=0,c=b.data.length;d<c;d++){a.append(buildComment(b.data[d]))}a.slideDown()})}function buildItem(j){var g=j.attribution?j.attribution:"Facebook";var f=$("<div class='feed-item'></div>");var k="";switch(j.type){case"link":case"video":if(j.message){k=formatMessage(j.message)}else{if(j.link&&j.name){k='<a href="'+j.link+'" title="'+j.name+'" target="_blank">'+j.name+"</a>";if(j.description){k+="<br />"+j.description}}}break;case"status":k=formatMessage(j.message);break;case"photo":k=buildPhotoMessage(j);break;default:if(j.message){k=formatMessage(j.message)}}f.append("<div class='message'>"+k+"</div>");switch(j.type){case"link":if(j.picture){f.append("<div class='image'><a href='"+j.link+"' target='_blank'><img src='"+j.picture+"' alt='"+j.name+"' /></a></div>")}else{var c=parseTwitpic(j.message);if(c){f.append("<div class='image'><a href='"+c.url+"' target='_blank'><img src='"+c.thumb+"' alt='twitpic' width='150' height='150' /></a></div>");g="TwitPic"}}break;case"photo":if(j.picture){f.append("<div class='image'><a href='"+j.link+"' target='_blank'><img src='"+j.picture+"' alt='"+j.name+"' /></a></div>")}break}var h=$("<div class='metadata'></div>");f.append(h);h.append(convertDateTimeString(j.created_time)+" via "+g);if(fbr_config.enable_comment){h.append(" - <a href='#'>Comment</a>")}if(fbr_config.enable_like){var a=$("<a class='likelink' href='javascript:void(0)'>Like</a>");a.click(function(){like(j.id,f)});h.append(" - ");h.append(a)}if(j.likes&&fbr_config.show_likes){f.append("<div class='likes'>"+j.likes+(j.likes==1?" person likes ":" people like ")+"this</div>")}if(j.comments&&fbr_config.show_comments){var m=$("<div class='comments'></div>");f.append(m);if(j.comments.count>j.comments.data.length){var e=$("<a class='more-comments' href='javascript:void(0);'>View all "+j.comments.count+" comments</a>");e.click(function(){FB.api("/"+j.id+"/comments","get",{access_token:fbr_access_token},function(i){parseMoreComments(i,e.parent("div.comments"))})});m.append(e)}for(var d=0,b=j.comments.data.length;d<b;d++){$(buildComment(j.comments.data[d])).hide().appendTo(m).fadeIn()}}return f}function buildComment(d){if(!d.message||!d.from){return""}var c=$("<div class='comment'></div>");c.append("<div class='comment-photo'><a href='http://www.facebook.com/profile.php?id="+d.from.id+"' target='_blank'><img src='http://graph.facebook.com/"+d.from.id+"/picture?type=square' alt='"+d.from.name+"' width='50' height='50' /></a></div>");var b=$("<div class='comment-details'></div");c.append(b);b.append("<div class='commenter'><a href='http://www.facebook.com/profile.php?id="+d.from.id+"' target='_blank'>"+d.from.name+"</a></div>");b.append("<div class='comment-text'>"+formatMessage(d.message)+"</div>");var a=$("<div class='metadata'></div>");b.append(a);a.append(convertDateTimeString(d.created_time)+" via Facebook");return c}function buildPhotoMessage(c){var b;var a;if(c.message){b=c.message}else{if(c.description){b=c.description}}if(c.name){a=c.name;if(c.caption){a+=" ("+c.caption+")"}}else{if(c.caption){a=c.caption}}if(c.link){a="<a href='"+c.link+"' target='_blank'>"+a+"</a>"}if(b){return b+"<br />"+a}else{return a}}function parseAndDisplayPhotos(b){if(!b||!b.data){console.log("Error loading photos");console.log(b);return}if($("div#fb-photos div.paging-link").length>0){$("div#fb-photos div.paging-link").remove()}for(var c=0,a=b.data.length;c<a;c++){$(buildPhoto(b.data[c])).hide().appendTo("div#fb-photos").fadeIn()}if(b.paging&&b.paging.next){$("<div class='paging-link'><a href='javascript:void(0);'>More</a></div>").hide().appendTo("div#fb-photos").fadeIn();var d=b.paging.next.replace(/https:\/\/graph.facebook.com/i,"");$("div#fb-photos div.paging-link a").click(function(){FB.api(d,"get",{access_token:fbr_access_token},parseAndDisplayPhotos)})}}function buildPhoto(e){var b=100;var d=e.width;var a=e.height;var c=d/a;if(d>a){a=b;d=a*c}else{if(a>d){d=b;a=d/c}else{d=a=b}}return"<div class='thumbnail'><img src='"+e.picture+"' alt='' width='"+d+"' height='"+a+"' /></div>"}function formatMessage(a){return a?linkify(a,{callback:linkifyNewWindow}).replace(/\n/g,"<br />"):""}function parseTwitpic(b){var a=/http:\/\/twitpic.com\/([a-z0-9]+)/;var d=a.exec(b);if(d){var c={};c.url=d[0];c.thumb="http://twitpic.com/show/thumb/"+d[1];return c}else{return false}}function like(a,b){FB.getLoginStatus(function(c){if(c.session){FB.api(a+"/likes","post",function(d){if(!d||d.error){console.log("Error liking content "+a)}else{b.find("a.likelink").replaceWith("Liked")}})}else{FB.login(function(d){if(d.session){FB.api(a+"/likes","post",function(e){if(!e||e.error){console.log("Error liking content "+a)}else{b.find("a.likelink").replaceWith("Liked")}})}else{console.log("User cancelled login")}},{perms:"publish_stream"})}})}function convertDateTimeString(b){var d=/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-]\d{4})/;var g=d.exec(b);utc_time=Date.UTC(g[1],parseInt(g[2],10)-1,g[3],g[4],g[5],g[6]);date=new Date(utc_time);var c=["January","February","March","April","May","June","July","August","September","October","November","December"];var f=c[date.getMonth()];var a=date.getDate();var e=(date.getHours()%12||12)+":"+(date.getMinutes()<10?"0":"")+date.getMinutes()+(date.getHours()<12?"am":"pm");return f+" "+a+" at "+e}window.linkify=(function(){var t="[a-z\\d.-]+://",w="(?:(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])\\.){3}(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])",B="(?:(?:[^\\s!@#$%^&*()_=+[\\]{}\\\\|;:'\",.<>/?]+)\\.)+",q="(?:ac|ad|aero|ae|af|ag|ai|al|am|an|ao|aq|arpa|ar|asia|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|biz|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|cat|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|coop|com|co|cr|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|edu|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gov|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|info|int|in|io|iq|ir|is|it|je|jm|jobs|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mil|mk|ml|mm|mn|mobi|mo|mp|mq|mr|ms|mt|museum|mu|mv|mw|mx|my|mz|name|na|nc|net|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|org|pa|pe|pf|pg|ph|pk|pl|pm|pn|pro|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tel|tf|tg|th|tj|tk|tl|tm|tn|to|tp|travel|tr|tt|tv|tw|tz|ua|ug|uk|um|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|xn--0zwm56d|xn--11b5bs3a9aj6g|xn--80akhbyknj4f|xn--9t4b11yi5a|xn--deba0ad|xn--g6w251d|xn--hgbk6aj7f53bba|xn--hlcj6aya9esc7a|xn--jxalpdlp|xn--kgbechtv|xn--zckzah|ye|yt|yu|za|zm|zw)",y="(?:"+B+q+"|"+w+")",p="(?:[;/][^#?<>\\s]*)?",z="(?:\\?[^#<>\\s]*)?(?:#[^<>\\s]*)?",A="\\b"+t+"[^<>\\s]+",D="\\b"+y+p+z+"(?!\\w)",r="mailto:",u="(?:"+r+")?[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@"+y+z+"(?!\\w)",s=new RegExp("(?:"+A+"|"+D+"|"+u+")","ig"),x=new RegExp("^"+t,"i"),C={"'":"`",">":"<",")":"(","]":"[","}":"{","B;":"B+","b:":"b9"},v={callback:function(a,b){return b?'<a href="'+b+'" title="'+b+'">'+a+"</a>":a},punct_regexp:/(?:[!?.,:;'"]|(?:&|&amp;)(?:lt|gt|quot|apos|raquo|laquo|rsaquo|lsaquo);)$/};return function(m,h){h=h||{};var k,l,g,f,j="",n=[],F,o,d,i,c,b,e,a;for(l in v){if(h[l]===undefined){h[l]=v[l]}}while(k=s.exec(m)){g=k[0];o=s.lastIndex;d=o-g.length;if(/[\/:]/.test(m.charAt(d-1))){continue}do{i=g;a=g.substr(-1);e=C[a];if(e){c=g.match(new RegExp("\\"+e+"(?!$)","g"));b=g.match(new RegExp("\\"+a,"g"));if((c?c.length:0)<(b?b.length:0)){g=g.substr(0,g.length-1);o--}}if(h.punct_regexp){g=g.replace(h.punct_regexp,function(E){o-=E.length;return""})}}while(g.length&&g!==i);f=g;if(!x.test(f)){f=(f.indexOf("@")!==-1?(!f.indexOf(r)?"":r):!f.indexOf("irc.")?"irc://":!f.indexOf("ftp.")?"ftp://":"http://")+f}if(F!=d){n.push([m.slice(F,d)]);F=o}n.push([g,f])}n.push([m.substr(F)]);for(l=0;l<n.length;l++){j+=h.callback.apply(window,n[l])}return j||m}})();function linkifyNewWindow(b,a){return a?'<a href="'+a+'" title="'+a+'" target="_blank">'+b+"</a>":b};