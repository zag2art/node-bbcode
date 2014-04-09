var bbcode = require('../lib/bbcode');

require('should');

describe('bcrypt', function () {
  describe('#parse', function () {
    it('should parse [b] to <b>', function () {
      var parse = bbcode.parse('[b]Bold[/b]');
      parse.should.equal('<b>Bold</b>');
    });

    it('should parse [i] to <i>', function () {
      var parse = bbcode.parse('[i]italics[/i]');
      parse.should.equal('<i>italics</i>');
    });

    it('should parse [u] to <u>', function () {
      var parse = bbcode.parse('[u]underline[/u]');
      parse.should.equal('<u>underline</u>');
    });


    it('should parse [color] to <span style="color:<color>"> for all colors', function () {
      var colors = ['black', 'silver', 'gray', 'maroon', 'white', 'red', 'purple', 'fuchsia', 'green', 'lime', 'olive', 'yellow', 'navy', 'blue', 'teal', 'aqua', '#fff', '#ffffff', '#ff34ff'];

      for (var i = 0; i < colors.length; i++) {
        var color = colors[i];
        var parse = bbcode.parse('[color=' + color + ']' + color + '[/color]');
        parse.should.equal('<span style="color: ' + color + '">' + color + '</span>');
      }
    });


    it('should parse [s] to <span style="text-decoration: line-through"', function () {
      var parse = bbcode.parse('[s]strikethrough[/s]');
      parse.should.equal('<s>strikethrough</s>');
    });

    describe('should parse [url]', function () {
      it('should parse [url=<url>] to <a href=<url>>', function () {
        var parse = bbcode.parse('[url=http://example.com]url[/url]');
        parse.should.equal('<a target="_blank" href="http://example.com">url</a>');

      });

      it('should parse [url="<url>"] to <a href=<url>>', function () {
        var parse = bbcode.parse('[url="http://example.com"]url[/url]');
        parse.should.equal('<a target="_blank" href="http://example.com">url</a>');

      });

      it('should parse [url=\'<url>\'] to <a href=<url>>', function () {
        var parse = bbcode.parse('[url=\'http://example.com\']url[/url]');
        parse.should.equal('<a target="_blank" href="http://example.com">url</a>');

      });

    });

    describe('should parse [img]', function () {
      it('as attribute - [img=<img>] to <img src=<img>>', function () {
        var parse = bbcode.parse('[img=http://example.com/img.png][/img]');
        parse.should.equal('<img src="http://example.com/img.png" />');
      });

      it('as attribute with quotes - [img="<img>"] to <img src=<img>>', function () {
        var parse = bbcode.parse('[img="http://example.com/img.png"][/img]');
        parse.should.equal('<img src="http://example.com/img.png" />');
      });

      it('as attribute with single quotes - [img=\'<img>\'] to <img src=<img>>', function () {
        var parse = bbcode.parse('[img=\'http://example.com/img.png\'][/img]');
        parse.should.equal('<img src="http://example.com/img.png" />');
      });

      it('as content - [img]<img>[/img] to <img src=<img>>', function () {
        var parse = bbcode.parse('[img]http://example.com/img.png[/img]');
        parse.should.equal('<img src="http://example.com/img.png" />');
      });
    });

    describe('should parse [skin]', function () {
      it('as attribute - [skin]name[/skin] to <img src="name">', function () {
        var parse = bbcode.parse('[skin]name[/skin]');
        parse.should.equal('<img src=\"http://bombermine.com/api/ctor/getskin?name=name&thumb=1\" />');
      });
    });

    it('should parse [quote] as <blockquote>', function () {
      var parse = bbcode.parse('[quote=person]quoted[/quote]');
      parse.should.equal('<blockquote cite="person">quoted</blockquote>');
    });

    it('should try to fix broken markup', function () {
      var parse = bbcode.parse('[b]test');
      parse.should.equal('<b>test</b>');
    });


    it('should parse inner tags [b][i][u] to <b><i><u>', function () {
      var parse = bbcode.parse('[b][i][u]Hai[/u][/i][/b]');
      parse.should.equal('<b><i><u>Hai</u></i></b>');

    });

    describe('should parse uppercase tags properly - ', function () {
      it('should parse uppercase [I] to <i>', function () {
        var parse = bbcode.parse('[I]italics[/I]');
        parse.should.equal('<i>italics</i>');

      });
      it('should parse uppercase [IMG] to <img>', function () {
        var parse = bbcode.parse('[IMG]http://example.com/img.png[/IMG]');
        parse.should.equal('<img src="http://example.com/img.png" />');

      });
      it('should parse mixed case [IMG][/img] to <img>', function () {
        var parse = bbcode.parse('[Img]http://example.com/img.png[/img]');
        parse.should.equal('<img src="http://example.com/img.png" />');
      });
    });
  });
});
