var _     = require('lodash');
var uuid  = require('node-uuid');

//
// post must be HTML-encoded
//
var tags = [
  'b',
  'i',
  'u',
  's',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'skin',
  'color',
  'url',
  'img',
  'quote',
  'player',
  'spoiler',
  'offtopic'
];

var regulars = {

};

var colors = [
  'black',
  'silver',
  'gray',
  'white',
  'maroon',
  'red',
  'purple',
  'fuchsia',
  'green',
  'lime',
  'olive',
  'yellow',
  'navy',
  'blue',
  'teal',
  'aqua',
];

var r_crlf    = "([\\r\\n])";
var r_tagName = "([a-z]{1,16}[1-6]?)";
var r_quotes  = "(?:\"|'|)";
var r_option  = "([^\x00-\\x1F\"'\\(\\)<>\\[\\]]{1,256})";

exports.parse = function(post, excludedTags) {
  var users = {};
  var opentags = [];      // open tag stack
  var crlf2br = true;     // convert CRLF to <br>?

  var urlstart = -1;      // beginning of the URL if zero or greater (ignored if -1)

  // aceptable BBcode tags, optionally prefixed with a slash

  var bbTags = _.difference(tags, excludedTags);

  var tagname_re = new RegExp('^\/?(?:' + bbTags.join('|') + ')$' , 'i');

  // color names or hex color
  var color_re = new RegExp('^(:?' + colors.join('|') +'|#(?:[0-9a-f]{3})?[0-9a-f]{3})$', 'i');

  // numbers
  var number_re = /^[\\.0-9]{1,8}$/i;

  // reserved, unreserved, escaped and alpha-numeric [RFC2396]
  var uri_re = /^[-;\/\?:@&=\+\$,_\.!~\*'\(\)%0-9a-z]{1,512}$/i;

  // main regular expression: CRLF, [tag=option], [tag="option"] [tag] or [/tag]
//  var postfmt_re = /([\r\n])|(?:\[([a-z]{1,16}[1-6]?)(?:=(?:"|'|)([^\x00-\x1F"'\(\)<>\[\]]{1,256}))?(?:"|'|)\])|(?:\[\/([a-z]{1,16}[1-6]?)\])/ig;

  var mainRegExp = {
    lineBreak: r_crlf,
    openTag: "(?:\\[" + r_tagName+"(?:="+ r_quotes+ r_option + r_quotes+")?\\])",
    closeTag: "(?:\\[\\/"+r_tagName + "\\])",
    nickName: "@([a-zA-Z0-9_]{3,20})"
  }

  var postfmt_re = new RegExp(
    // Перенос строки - CRLF
    mainRegExp.lineBreak +
      "|"+
    // Тег с параметром - [tag=option] или [tag="option"] или [tag]
    // Запоминаем сам тег и опцию
    mainRegExp.openTag +
      "|"+
    //Закрывающаяся часть тега - [/tag]
    mainRegExp.closeTag +
      "|"+
    //Имя пользователя или id - @jedi @zag2art @100
    mainRegExp.nickName

  , "ig");

  // stack frame object
  function taginfo_t(bbtag, etag)
  {
    return {
      bbtag: bbtag,
        etag: etag
    };
  }

  // check if it's a valid BBCode tag
  function isValidTag(str)
  {
    if(!str || !str.length)
      return false;

//    console.log('test: ', str)
    return tagname_re.test(str);
  }

  //
  // m1 - CR or LF
  // m2 - the tag of the [tag=option] expression
  // m3 - the option of the [tag=option] expression
  // m4 - the end tag of the [/tag] expression
  //
  function textToHtmlCB(mstr, m1, m2, m3, m4, m5, offset, string)
  {
//    console.log('Replace: ', arguments);
    //
    // CR LF sequences
    //
    if(m1 && m1.length) {
      if(!crlf2br)
        return mstr;

      switch (m1) {
        case '\r':
          return "";
        case '\n':
          return "<br>";
      }
    }

    //
    // handle start tags
    //
    if(isValidTag(m2)) {
      var m2l = m2.toLowerCase();


      // ignore any tags if there's an open optionless [url] tag
      if(opentags.length && (opentags[opentags.length-1].bbtag == "url" || opentags[opentags.length-1].bbtag == "img") && urlstart >= 0)
        return "[" + m2 + "]";

      switch (m2l) {
        case "color":
//        case "colour":
          if(!m3 || !color_re.test(m3))
            m3 = "inherit";
          opentags.push(new taginfo_t(m2l, "</span>"));
          return "<span style=\"color: " + m3 + "\">";

        case "url":
          opentags.push(new taginfo_t(m2l, "</a>"));

          // check if there's a valid option
          if(m3 && uri_re.test(m3)) {
            // if there is, output a complete start anchor tag
            urlstart = -1;
            return "<a target=\"_blank\" href=\"" + m3 + "\">";
          }

          // otherwise, remember the URL offset
          urlstart = mstr.length + offset;

          // and treat the text following [url] as a URL
          return "<a target=\"_blank\" href=\"";
        case "img":
          opentags.push(new taginfo_t(m2l, "\" />"));

          if (m3  && uri_re.test(m3)) {
            urlstart = -1;

            return "<" + m2l + " src=\"" + m3 + "";
          }

          urlstart = mstr.length + offset;

          return "<"+m2l+" src=\"";

        case "quote":
          var tag = "blockquote";
          opentags.push(new taginfo_t(m2l, "</" + tag + ">"));
          return m3 && m3.length && uri_re.test(m3) ? "<" + tag + " cite=\"" + m3 + "\">" : "<" + tag + ">";

        case "b":
          opentags.push(new taginfo_t('b', '</b>'));
          return '<b>';

        case "i":
          opentags.push(new taginfo_t('i', '</i>'));
          return '<i>';

        case "skin":
          opentags.push(new taginfo_t(m2l, "&thumb=1\" />"));
          return '<img class="bb-skin" src="http://bombermine.com/api/ctor/getskin?name=';

        case "spoiler":
          opentags.push(new taginfo_t('spoiler', '</div></label>'));

          return '<label class="spoiler"><input class="spoiler-input" type="checkbox" /><div class="spoiler-title">' + m3 + '</div><div class="spoiler-body">'


        default:
          // [samp] and [u] don't need special processing
          opentags.push(new taginfo_t(m2l, "</" + m2l + ">"));
          return "<" + m2l + ">";

      }
    }

    if(isValidTag(m4)) {
      var m4l = m4.toLowerCase();

      // highlight mismatched end tags
      if(!opentags.length || opentags[opentags.length-1].bbtag != m4l)
        return "<span style=\"color: red\">[/" + m4 + "]</span>";

      if(m4l == "url") {
        // if there was no option, use the content of the [url] tag
        if(urlstart > 0)
          return "\">" + string.substr(urlstart, offset-urlstart) + opentags.pop().etag;

        // otherwise just close the tag
        return opentags.pop().etag;
      }

      // other tags require no special processing, just output the end tag
      var end = opentags.pop().etag;
      return end;
    }

    if(m5) {
      var uid = users[m5];
      if (!uid) {
        uid = uuid.v1();
        users[m5] = uid;
      }

//      console.log("Found user:", m5, uid);
      return '<a class="bb-user" href="#{'+ uid +'}">@' + m5+ '</a>';

    }

    return mstr;
  }

  // actual parsing can begin
  var result = '', endtags, tag;

  // convert CRLF to <br> by default
  crlf2br = true;

  // create a new array for open tags
  if(opentags == null || opentags.length)
    opentags = new Array(0);

  // run the text through main regular expression matcher
  if (post) {

    result = post.replace(postfmt_re, textToHtmlCB);

    // if there are any unbalanced tags, make sure to close them
    if(opentags.length) {
      endtags = new String();

      // if there's an open [url] at the top, close it
      if(opentags[opentags.length-1].bbtag == "url") {
        opentags.pop();
        endtags += "\">" + post.substr(urlstart, post.length-urlstart) + "</a>";
      }

      if(opentags[opentags.length-1].bbtag == "img") {
        opentags.pop();
        endtags += post.substr(urlstart, post.length-urlstart) + "\" />";
      }


      // close remaining open tags
      while(opentags.length)
        endtags += opentags.pop().etag;
    }
  }
  var html = endtags ? result + endtags : result;

  return {
    html: html,
    users: users
  };
}
