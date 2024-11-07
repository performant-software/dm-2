// include the following code in <script> tags on the same page as an embedded instance
const frame = document.querySelector("iframe");
// allow writing to the clipboard from another domain
frame.setAttribute("allow", "clipboard-write *");
const queryParams = window.location.search;
if (queryParams !== "") {
  // pass query params to iframe embed's src attribute (app url)
  frame.src = frame.src + queryParams;
} else {
  // refresh iframe content to apply clipboard-write permission
  frame.src = frame.src;
}
