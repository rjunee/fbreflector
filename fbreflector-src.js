/**
 * Copyright Ryan Junee
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
 *
 * This code loads the specified user's facebook feed and builds HTML to display it
 *
 */
 
$(document).ready(function(){
  // Dummy console if no firebug
  if(typeof console === "undefined") {
    console = { log: function() { } };
  }
  
  // Load feed
  FB.api('/' + fbr_user_id + '/posts', 'get', { access_token: fbr_access_token }, parseAndDisplayFeed);
  // Request /feed instead of /posts if you want to include wall posts from others
});



// Parse and display feed returned from Facebook API call
function parseAndDisplayFeed(response) {
  // Make sure we got something back
  if (!response || !response.data) {
    console.log("Error loading feed");
    console.log(response);
    return;
  }
  
  // Remove existing paging link (if it exists)
  if ($('div#fb-reflector div#paging-link').length > 0) {
    $('div#fb-reflector div#paging-link').remove();
  }
  
  // Build each item
  for (var i = 0, l = response.data.length; i < l; i++) {
    $(buildItem(response.data[i])).hide().appendTo('div#fb-reflector').fadeIn();
  }
  
  // Add paging link if necessary
  if (response.paging && response.paging.next) {
    $("<div id='paging-link'><a href='javascript:void(0);'>Older Posts</a></div>").hide().appendTo('div#fb-reflector').fadeIn();
    var next_path = response.paging.next.replace(/https:\/\/graph.facebook.com/i, '');
    $('div#fb-reflector div#paging-link a').click(function() {
      FB.api(next_path, 'get', { access_token: fbr_access_token }, parseAndDisplayFeed);
    });
  }
}



// Build HTML for a feed item represented in JSON
// TODO: Is this susceptible to script injection? Or does facebook sanitize data returned?
function buildItem(item) {
  if (!item.message) {
    return "";
  }
  
  console.log(item);
  
  var service = item.attribution ? item.attribution : 'Facebook';

  // Message and metadata
  var html = $("<div class='feed-item'></div>");
  html.append("<div class='message'>" + item.message.replace(/\n/g, '<br />') + "</div>");
  var metadata = $("<div class='metadata'></div>");
  html.append(metadata)
  metadata.append(convertDateTimeString(item.created_time) + " via " + service + " - <a href='#'>Comment</a> - <a href='#'>Like</a>");
  
  // Likes
  if (item.likes) {
    html.append("<div class='likes'>" + item.likes + (item.likes == 1 ? " person likes " : " people like ") + "this</div>");
  }
  
  // Comments
  if (item.comments) {
    var comments_div = $("<div class='comments'></div>");
    html.append(comments_div);
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
  
  html.append("<div class='comment-photo'><img src='http://graph.facebook.com/" + comment.from.id + "/picture?type=square' alt='" + comment.from.name + "' width='50' height='50' /></div>");
  
  var details = $("<div class='comment-details'></div");
  html.append(details);
  details.append("<div class='commenter'>" + comment.from.name + "</div>");
  details.append("<div class='comment-text'>" + comment.message.replace(/\n/g, '<br />') + "</div>");
  var metadata = $("<div class='metadata'></div>");
  details.append(metadata);
  metadata.append(convertDateTimeString(comment.created_time) + " via Facebook");
  
  return html; 
}


// Converts the datetime string supplied by facebook into something more readable, and in local time
// Input: 2010-08-03T05:57:39+0000
// Output: August 2 at 10:57pm
function convertDateTimeString(input) { 
  parts = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-]\d{4})/(input);
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
