// include the following code in <script> tags on the same page as an embedded instance
const frame = document.querySelector("iframe");
// allow writing to the clipboard from another domain
frame.setAttribute("allow", "clipboard-write *");
const queryParams = window.location.search;
// pass query params to iframe embed's src attribute (app url)
frame.src = frame.src + queryParams;
// (if they are not present, will refresh frame src and apply clipboard-write perms)
