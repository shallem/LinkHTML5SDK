/*!
 * froala_editor v3.0.6 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms/
 * Copyright 2014-2019 Froala Labs
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('froala-editor')) :
  typeof define === 'function' && define.amd ? define(['froala-editor'], factory) :
  (factory(global.FroalaEditor));
}(this, (function (FE) { 'use strict';

  FE = FE && FE.hasOwnProperty('default') ? FE['default'] : FE;

  FE.PLUGINS.align = function (editor) {
    var $ = editor.$;

    function apply(val) {
      var el = editor.selection.element();

      if ($(el).parents('.fr-img-caption').length) {
        $(el).css('text-align', val);
      } else {
        // Wrap.
        editor.selection.save();
        editor.html.wrap(true, true, true, true);
        editor.selection.restore();
        var blocks = editor.selection.blocks();

        for (var i = 0; i < blocks.length; i++) {
          // https://github.com/froala-labs/froala-editor-js-2/issues/674
          $(blocks[i]).css('text-align', val).removeClass('fr-temp-div');
          if ($(blocks[i]).attr('class') === '') $(blocks[i]).removeAttr('class');
          if ($(blocks[i]).attr('style') === '') $(blocks[i]).removeAttr('style');
        }

        editor.selection.save();
        editor.html.unwrap();
        editor.selection.restore();
      }
    }

    function refresh($btn) {
      var blocks = editor.selection.blocks();

      if (blocks.length) {
        var alignment = editor.helpers.getAlignment($(blocks[0]));
        $btn.find('> *').first().replaceWith(editor.icon.create('align-' + alignment));
      }
    }

    function refreshOnShow($btn, $dropdown) {
      var blocks = editor.selection.blocks();

      if (blocks.length) {
        var alignment = editor.helpers.getAlignment($(blocks[0]));
        $dropdown.find('a.fr-command[data-param1="' + alignment + '"]').addClass('fr-active').attr('aria-selected', true);
      }
    }

    function refreshForToolbar($btn) {
      var blocks = editor.selection.blocks();

      if (blocks.length) {
        var alignment = editor.helpers.getAlignment($(blocks[0])); // Capitalize.

        alignment = alignment.charAt(0).toUpperCase() + alignment.slice(1);

        if ('align' + alignment === $btn.attr('data-cmd')) {
          $btn.addClass('fr-active');
        }
      }
    }

    return {
      apply: apply,
      refresh: refresh,
      refreshOnShow: refreshOnShow,
      refreshForToolbar: refreshForToolbar
    };
  };

  FE.DefineIcon('align', {
    NAME: 'align-left',
    SVG_KEY: 'alignLeft'
  });
  FE.DefineIcon('align-left', {
    NAME: 'align-left',
    SVG_KEY: 'alignLeft'
  });
  FE.DefineIcon('align-right', {
    NAME: 'align-right',
    SVG_KEY: 'alignRight'
  });
  FE.DefineIcon('align-center', {
    NAME: 'align-center',
    SVG_KEY: 'alignCenter'
  });
  FE.DefineIcon('align-justify', {
    NAME: 'align-justify',
    SVG_KEY: 'alignJustify'
  });
  FE.RegisterCommand('align', {
    type: 'dropdown',
    title: 'Align',
    options: {
      left: 'Align Left',
      center: 'Align Center',
      right: 'Align Right',
      justify: 'Align Justify'
    },
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = FE.COMMANDS.align.options;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          c += '<li role="presentation"><a class="fr-command fr-title" tabIndex="-1" role="option" data-cmd="align" data-param1="' + val + '" title="' + this.language.translate(options[val]) + '">' + this.icon.create('align-' + val) + '<span class="fr-sr-only">' + this.language.translate(options[val]) + '</span></a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      this.align.apply(val);
    },
    refresh: function refresh($btn) {
      this.align.refresh($btn);
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      this.align.refreshOnShow($btn, $dropdown);
    },
    plugin: 'align'
  });
  FE.RegisterCommand('alignLeft', {
    type: 'button',
    icon: 'align-left',
    title: 'Align Left',
    callback: function callback() {
      this.align.apply('left');
    },
    refresh: function refresh($btn) {
      this.align.refreshForToolbar($btn);
    },
    plugin: 'align'
  });
  FE.RegisterCommand('alignRight', {
    type: 'button',
    icon: 'align-right',
    title: 'Align Right',
    callback: function callback() {
      this.align.apply('right');
    },
    refresh: function refresh($btn) {
      this.align.refreshForToolbar($btn);
    },
    plugin: 'align'
  });
  FE.RegisterCommand('alignCenter', {
    type: 'button',
    icon: 'align-center',
    title: 'Align Center',
    callback: function callback() {
      this.align.apply('center');
    },
    refresh: function refresh($btn) {
      this.align.refreshForToolbar($btn);
    },
    plugin: 'align'
  });
  FE.RegisterCommand('alignJustify', {
    type: 'button',
    icon: 'align-justify',
    title: 'Align Justify',
    callback: function callback() {
      this.align.apply('justify');
    },
    refresh: function refresh($btn) {
      this.align.refreshForToolbar($btn);
    },
    plugin: 'align'
  });

  Object.assign(FE.DEFAULTS, {
    charCounterMax: -1,
    charCounterCount: true
  });

  FE.PLUGINS.charCounter = function (editor) {
    var $ = editor.$;
    var $counter;
    /**
     * Get the char number.
     */

    function count() {
      return (editor.el.textContent || '').replace(/\u200B/g, '').length;
    }
    /**
     * Check chars on typing.
     */


    function _checkCharNumber(e) {
      // Continue if infinite characters.
      if (editor.opts.charCounterMax < 0) return true; // Continue if enough characters.

      if (count() < editor.opts.charCounterMax) return true; // Stop if the key will produce a new char.

      var keyCode = e.which;

      if (!editor.keys.ctrlKey(e) && editor.keys.isCharacter(keyCode) || keyCode === FE.KEYCODE.IME) {
        e.preventDefault();
        e.stopPropagation();
        editor.events.trigger('charCounter.exceeded');
        return false;
      }

      return true;
    }
    /**
     * Check chars on paste.
     */


    function _checkCharNumberOnPaste(html) {
      if (editor.opts.charCounterMax < 0) return html;
      var len = $('<div>').html(html).text().length;
      if (len + count() <= editor.opts.charCounterMax) return html;
      editor.events.trigger('charCounter.exceeded');
      return '';
    }
    /**
     * Update the char counter.
     */


    function _updateCharNumber() {
      if (editor.opts.charCounterCount) {
        var chars = count() + (editor.opts.charCounterMax > 0 ? '/' + editor.opts.charCounterMax : '');
        $counter.text("".concat(editor.language.translate('Characters'), " : ").concat(chars));

        if (editor.opts.toolbarBottom) {
          $counter.css('margin-bottom', editor.$tb.outerHeight(true));
        } // Scroll size correction.


        var scroll_size = editor.$wp.get(0).offsetWidth - editor.$wp.get(0).clientWidth;

        if (scroll_size >= 0) {
          if (editor.opts.direction == 'rtl') {
            $counter.css('margin-left', scroll_size);
          } else {
            $counter.css('margin-right', scroll_size);
          }
        }
      }
    }
    /*
     * Initialize.
     */


    function _init() {
      if (!editor.$wp) return false;
      if (!editor.opts.charCounterCount) return false;
      $counter = $(document.createElement('span')).attr('class', 'fr-counter');
      $counter.css('bottom', editor.$wp.css('border-bottom-width')); // Append char counter only if second toolbar exists

      if (editor.$second_tb) {
        editor.$second_tb.append($counter);
      }

      editor.events.on('keydown', _checkCharNumber, true);
      editor.events.on('paste.afterCleanup', _checkCharNumberOnPaste);
      editor.events.on('keyup contentChanged input', function () {
        editor.events.trigger('charCounter.update');
      });
      editor.events.on('charCounter.update', _updateCharNumber);
      editor.events.trigger('charCounter.update');
      editor.events.on('destroy', function () {
        $(editor.o_win).off('resize.char' + editor.id);
        $counter.removeData().remove();
        $counter = null;
      });
    }

    return {
      _init: _init,
      count: count
    };
  };

  FE.PLUGINS.codeBeautifier = function () {
    /**
       * HTML BEAUTIFIER
       *
       * LICENSE: The MIT License (MIT)
       *
       * Written by Nochum Sossonko, (nsossonko@hotmail.com)
       *
       * Based on code initially developed by: Einar Lielmanis, <einar@jsbeautifier.org>
       * http://jsbeautifier.org/
       *
       */

    /* jshint ignore:start */

    /* jscs:disable */
    var acorn = {};

    (function (exports) {

      var nonASCIIidentifierStartChars = "\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC";
      var nonASCIIidentifierChars = "\u0300-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u0620-\u0649\u0672-\u06D3\u06E7-\u06E8\u06FB-\u06FC\u0730-\u074A\u0800-\u0814\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0840-\u0857\u08E4-\u08FE\u0900-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962-\u0963\u0966-\u096F\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09D7\u09DF-\u09E0\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A66-\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5F-\u0B60\u0B66-\u0B6F\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0BE6-\u0BEF\u0C01-\u0C03\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62-\u0C63\u0C66-\u0C6F\u0C82\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2-\u0CE3\u0CE6-\u0CEF\u0D02\u0D03\u0D46-\u0D48\u0D57\u0D62-\u0D63\u0D66-\u0D6F\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E34-\u0E3A\u0E40-\u0E45\u0E50-\u0E59\u0EB4-\u0EB9\u0EC8-\u0ECD\u0ED0-\u0ED9\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F41-\u0F47\u0F71-\u0F84\u0F86-\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1029\u1040-\u1049\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109D\u135D-\u135F\u170E-\u1710\u1720-\u1730\u1740-\u1750\u1772\u1773\u1780-\u17B2\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1920-\u192B\u1930-\u193B\u1951-\u196D\u19B0-\u19C0\u19C8-\u19C9\u19D0-\u19D9\u1A00-\u1A15\u1A20-\u1A53\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1B46-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1BB0-\u1BB9\u1BE6-\u1BF3\u1C00-\u1C22\u1C40-\u1C49\u1C5B-\u1C7D\u1CD0-\u1CD2\u1D00-\u1DBE\u1E01-\u1F15\u200C\u200D\u203F\u2040\u2054\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2D81-\u2D96\u2DE0-\u2DFF\u3021-\u3028\u3099\u309A\uA640-\uA66D\uA674-\uA67D\uA69F\uA6F0-\uA6F1\uA7F8-\uA800\uA806\uA80B\uA823-\uA827\uA880-\uA881\uA8B4-\uA8C4\uA8D0-\uA8D9\uA8F3-\uA8F7\uA900-\uA909\uA926-\uA92D\uA930-\uA945\uA980-\uA983\uA9B3-\uA9C0\uAA00-\uAA27\uAA40-\uAA41\uAA4C-\uAA4D\uAA50-\uAA59\uAA7B\uAAE0-\uAAE9\uAAF2-\uAAF3\uABC0-\uABE1\uABEC\uABED\uABF0-\uABF9\uFB20-\uFB28\uFE00-\uFE0F\uFE20-\uFE26\uFE33\uFE34\uFE4D-\uFE4F\uFF10-\uFF19\uFF3F";
      var nonASCIIidentifierStart = new RegExp('[' + nonASCIIidentifierStartChars + ']');
      var nonASCIIidentifier = new RegExp('[' + nonASCIIidentifierStartChars + nonASCIIidentifierChars + ']'); // Whether a single character denotes a newline.

      exports.newline = /[\n\r\u2028\u2029]/; // Matches a whole line break (where CRLF is considered a single
      // line break). Used to count lines.
      // in javascript, these two differ
      // in python they are the same, different methods are called on them

      exports.lineBreak = new RegExp('\r\n|' + exports.newline.source);
      exports.allLineBreaks = new RegExp(exports.lineBreak.source, 'g'); // Test whether a given character code starts an identifier.

      exports.isIdentifierStart = function (code) {
        // permit $ (36) and @ (64). @ is used in ES7 decorators.
        if (code < 65) return code === 36 || code === 64; // 65 through 91 are uppercase letters.

        if (code < 91) return true; // permit _ (95).

        if (code < 97) return code === 95; // 97 through 123 are lowercase letters.

        if (code < 123) return true;
        return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
      }; // Test whether a given character is part of an identifier.


      exports.isIdentifierChar = function (code) {
        if (code < 48) return code === 36;
        if (code < 58) return true;
        if (code < 65) return false;
        if (code < 91) return true;
        if (code < 97) return code === 95;
        if (code < 123) return true;
        return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
      };
    })(acorn);

    function run(html_source, options) {
      function ltrim(s) {
        return s.replace(/^\s+/g, '');
      }

      function rtrim(s) {
        return s.replace(/\s+$/g, '');
      }

      var multi_parser;
      var indent_inner_html;
      var indent_size;
      var indent_character;
      var wrap_line_length;
      var brace_style;
      var unformatted;
      var preserve_newlines;
      var max_preserve_newlines;
      var indent_handlebars;
      var wrap_attributes;
      var wrap_attributes_indent_size;
      var end_with_newline;
      var extra_liners;
      options = options || {}; // backwards compatibility to 1.3.4

      if ((options.wrap_line_length === undefined || parseInt(options.wrap_line_length, 10) === 0) && options.max_char !== undefined && parseInt(options.max_char, 10) !== 0) {
        options.wrap_line_length = options.max_char;
      }

      indent_inner_html = options.indent_inner_html === undefined ? false : options.indent_inner_html;
      indent_size = options.indent_size === undefined ? 4 : parseInt(options.indent_size, 10);
      indent_character = options.indent_char === undefined ? ' ' : options.indent_char;
      brace_style = options.brace_style === undefined ? 'collapse' : options.brace_style;
      wrap_line_length = parseInt(options.wrap_line_length, 10) === 0 ? 32786 : parseInt(options.wrap_line_length || 250, 10);
      unformatted = options.unformatted || ['a', 'span', 'img', 'bdo', 'em', 'strong', 'dfn', 'code', 'samp', 'kbd', 'const', 'cite', 'abbr', 'acronym', 'q', 'sub', 'sup', 'tt', 'i', 'b', 'big', 'small', 'u', 's', 'strike', 'font', 'ins', 'del', 'address', 'pre'];
      preserve_newlines = options.preserve_newlines === undefined ? true : options.preserve_newlines;
      max_preserve_newlines = preserve_newlines ? isNaN(parseInt(options.max_preserve_newlines, 10)) ? 32786 : parseInt(options.max_preserve_newlines, 10) : 0;
      indent_handlebars = options.indent_handlebars === undefined ? false : options.indent_handlebars;
      wrap_attributes = options.wrap_attributes === undefined ? 'auto' : options.wrap_attributes;
      wrap_attributes_indent_size = options.wrap_attributes_indent_size === undefined ? indent_size : parseInt(options.wrap_attributes_indent_size, 10) || indent_size;
      end_with_newline = options.end_with_newline === undefined ? false : options.end_with_newline;
      extra_liners = Array.isArray(options.extra_liners) ? options.extra_liners.concat() : typeof options.extra_liners === 'string' ? options.extra_liners.split(',') : 'head,body,/html'.split(',');

      if (options.indent_with_tabs) {
        indent_character = '\t';
        indent_size = 1;
      }

      function Parser() {
        this.pos = 0; //Parser position

        this.token = '';
        this.current_mode = 'CONTENT'; //reflects the current Parser mode: TAG/CONTENT

        this.tags = {
          //An object to hold tags, their position, and their parent-tags, initiated with default values
          parent: 'parent1',
          parentcount: 1,
          parent1: ''
        };
        this.tag_type = '';
        this.token_text = this.last_token = this.last_text = this.token_type = '';
        this.newlines = 0;
        this.indent_content = indent_inner_html;
        this.Utils = {
          //Uilities made available to the various functions
          whitespace: '\n\r\t '.split(''),
          single_token: 'br,input,link,meta,source,!doctype,basefont,base,area,hr,wbr,param,img,isindex,embed'.split(','),
          //all the single tags for HTML
          extra_liners: extra_liners,
          //for tags that need a line of whitespace before them
          in_array: function in_array(what, arr) {
            for (var i = 0; i < arr.length; i++) {
              if (what === arr[i]) {
                return true;
              }
            }

            return false;
          } // Return true if the given text is composed entirely of whitespace.

        };

        this.is_whitespace = function (text) {
          for (var n = 0; n < text.length; text++) {
            if (!this.Utils.in_array(text.charAt(n), this.Utils.whitespace)) {
              return false;
            }
          }

          return true;
        };

        this.traverse_whitespace = function () {
          var input_char = '';
          input_char = this.input.charAt(this.pos);

          if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
            this.newlines = 0;

            while (this.Utils.in_array(input_char, this.Utils.whitespace)) {
              if (preserve_newlines && input_char === '\n' && this.newlines <= max_preserve_newlines) {
                this.newlines += 1;
              }

              this.pos++;
              input_char = this.input.charAt(this.pos);
            }

            return true;
          }

          return false;
        }; // Append a space to the given content (string array) or, if we are
        // at the wrap_line_length, append a newline/indentation.


        this.space_or_wrap = function (content) {
          if (this.line_char_count >= this.wrap_line_length) {
            //insert a line when the wrap_line_length is reached
            this.print_newline(false, content);
            this.print_indentation(content);
          } else {
            this.line_char_count++;
            content.push(' ');
          }
        };

        this.get_content = function () {
          //function to capture regular content between tags
          var input_char = '',
              content = [];

          while (this.input.charAt(this.pos) != '<') {
            if (this.pos >= this.input.length) {
              return content.length ? content.join('') : ['', 'TK_EOF'];
            }

            if (this.traverse_whitespace()) {
              this.space_or_wrap(content);
              continue;
            }

            if (indent_handlebars) {
              // Handlebars parsing is complicated.
              // {{#foo}} and {{/foo}} are formatted tags.
              // {{something}} should get treated as content, except:
              // {{else}} specifically behaves like {{#if}} and {{/if}}
              var peek3 = this.input.substr(this.pos, 3);

              if (peek3 === '{{#' || peek3 === '{{/') {
                // These are tags and not content.
                break;
              } else if (peek3 === '{{!') {
                return [this.get_tag(), 'TK_TAG_HANDLEBARS_COMMENT'];
              } else if (this.input.substr(this.pos, 2) === '{{') {
                if (this.get_tag(true) === '{{else}}') {
                  break;
                }
              }
            }

            input_char = this.input.charAt(this.pos);
            this.pos++;
            this.line_char_count++;
            content.push(input_char); //letter at-a-time (or string) inserted to an array
          }

          return content.length ? content.join('') : '';
        };

        this.get_contents_to = function (name) {
          //get the full content of a script or style to pass to js_beautify
          if (this.pos === this.input.length) {
            return ['', 'TK_EOF'];
          }

          var content = '';
          var reg_match = new RegExp('</' + name + '\\s*>', 'igm');
          reg_match.lastIndex = this.pos;
          var reg_array = reg_match.exec(this.input);
          var end_script = reg_array ? reg_array.index : this.input.length; //absolute end of script

          if (this.pos < end_script) {
            //get everything in between the script tags
            content = this.input.substring(this.pos, end_script);
            this.pos = end_script;
          }

          return content;
        };

        this.record_tag = function (tag) {
          //function to record a tag and its parent in this.tags Object
          if (this.tags[tag + 'count']) {
            //check for the existence of this tag type
            this.tags[tag + 'count']++;
            this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
          } else {
            //otherwise initialize this tag type
            this.tags[tag + 'count'] = 1;
            this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
          }

          this.tags[tag + this.tags[tag + 'count'] + 'parent'] = this.tags.parent; //set the parent (i.e. in the case of a div this.tags.div1parent)

          this.tags.parent = tag + this.tags[tag + 'count']; //and make this the current parent (i.e. in the case of a div 'div1')
        };

        this.retrieve_tag = function (tag) {
          //function to retrieve the opening tag to the corresponding closer
          if (this.tags[tag + 'count']) {
            //if the openener is not in the Object we ignore it
            var temp_parent = this.tags.parent; //check to see if it's a closable tag.

            while (temp_parent) {
              //till we reach '' (the initial value) 
              if (tag + this.tags[tag + 'count'] === temp_parent) {
                //if this is it use it
                break;
              }

              temp_parent = this.tags[temp_parent + 'parent']; //otherwise keep on climbing up the DOM Tree
            }

            if (temp_parent) {
              //if we caught something
              this.indent_level = this.tags[tag + this.tags[tag + 'count']]; //set the indent_level accordingly

              this.tags.parent = this.tags[temp_parent + 'parent']; //and set the current parent
            }

            delete this.tags[tag + this.tags[tag + 'count'] + 'parent']; //delete the closed tags parent reference...

            delete this.tags[tag + this.tags[tag + 'count']]; //...and the tag itself

            if (this.tags[tag + 'count'] === 1) {
              delete this.tags[tag + 'count'];
            } else {
              this.tags[tag + 'count']--;
            }
          }
        };

        this.indent_to_tag = function (tag) {
          // Match the indentation level to the last use of this tag, but don't remove it.
          if (!this.tags[tag + 'count']) {
            return;
          }

          var temp_parent = this.tags.parent;

          while (temp_parent) {
            if (tag + this.tags[tag + 'count'] === temp_parent) {
              break;
            }

            temp_parent = this.tags[temp_parent + 'parent'];
          }

          if (temp_parent) {
            this.indent_level = this.tags[tag + this.tags[tag + 'count']];
          }
        };

        this.get_tag = function (peek) {
          //function to get a full tag and parse its type
          var input_char = '',
              content = [],
              comment = '',
              space = false,
              first_attr = true,
              tag_start,
              tag_end,
              tag_start_char,
              orig_pos = this.pos,
              orig_line_char_count = this.line_char_count;
          peek = peek !== undefined ? peek : false;

          do {
            if (this.pos >= this.input.length) {
              if (peek) {
                this.pos = orig_pos;
                this.line_char_count = orig_line_char_count;
              }

              return content.length ? content.join('') : ['', 'TK_EOF'];
            }

            input_char = this.input.charAt(this.pos);
            this.pos++;

            if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
              //don't want to insert unnecessary space
              space = true;
              continue;
            }

            if (input_char === '\'' || input_char === '"') {
              input_char += this.get_unformatted(input_char);
              space = true;
            }

            if (input_char === '=') {
              //no space before =
              space = false;
            }

            if (content.length && content[content.length - 1] != '=' && input_char != '>' && space) {
              //no space after = or before >
              this.space_or_wrap(content);
              space = false;

              if (!first_attr && wrap_attributes === 'force' && input_char != '/') {
                this.print_newline(true, content);
                this.print_indentation(content);

                for (var count = 0; count < wrap_attributes_indent_size; count++) {
                  content.push(indent_character);
                }
              }

              for (var i = 0; i < content.length; i++) {
                if (content[i] === ' ') {
                  first_attr = false;
                  break;
                }
              }
            }

            if (indent_handlebars && tag_start_char === '<') {
              // When inside an angle-bracket tag, put spaces around
              // handlebars not inside of strings.
              if (input_char + this.input.charAt(this.pos) === '{{') {
                input_char += this.get_unformatted('}}');

                if (content.length && content[content.length - 1] != ' ' && content[content.length - 1] != '<') {
                  input_char = ' ' + input_char;
                }

                space = true;
              }
            }

            if (input_char === '<' && !tag_start_char) {
              tag_start = this.pos - 1;
              tag_start_char = '<';
            }

            if (indent_handlebars && !tag_start_char) {
              if (content.length >= 2 && content[content.length - 1] === '{' && content[content.length - 2] === '{') {
                if (input_char === '#' || input_char === '/' || input_char === '!') {
                  tag_start = this.pos - 3;
                } else {
                  tag_start = this.pos - 2;
                }

                tag_start_char = '{';
              }
            }

            this.line_char_count++;
            content.push(input_char); //inserts character at-a-time (or string)

            if (content[1] && (content[1] === '!' || content[1] === '?' || content[1] === '%')) {
              //if we're in a comment, do something special
              // We treat all comments as literals, even more than preformatted tags
              // we just look for the appropriate close tag
              content = [this.get_comment(tag_start)];
              break;
            }

            if (indent_handlebars && content[1] && content[1] === '{' && content[2] && content[2] === '!') {
              //if we're in a comment, do something special
              // We treat all comments as literals, even more than preformatted tags
              // we just look for the appropriate close tag
              content = [this.get_comment(tag_start)];
              break;
            }

            if (indent_handlebars && tag_start_char === '{' && content.length > 2 && content[content.length - 2] === '}' && content[content.length - 1] === '}') {
              break;
            }
          } while (input_char != '>');

          var tag_complete = content.join('');
          var tag_index;
          var tag_offset;

          if (tag_complete.indexOf(' ') != -1) {
            //if there's whitespace, thats where the tag name ends
            tag_index = tag_complete.indexOf(' ');
          } else if (tag_complete[0] === '{') {
            tag_index = tag_complete.indexOf('}');
          } else {
            //otherwise go with the tag ending
            tag_index = tag_complete.indexOf('>');
          }

          if (tag_complete[0] === '<' || !indent_handlebars) {
            tag_offset = 1;
          } else {
            tag_offset = tag_complete[2] === '#' ? 3 : 2;
          }

          var tag_check = tag_complete.substring(tag_offset, tag_index).toLowerCase();

          if (tag_complete.charAt(tag_complete.length - 2) === '/' || this.Utils.in_array(tag_check, this.Utils.single_token)) {
            //if this tag name is a single tag type (either in the list or has a closing /)
            if (!peek) {
              this.tag_type = 'SINGLE';
            }
          } else if (indent_handlebars && tag_complete[0] === '{' && tag_check === 'else') {
            if (!peek) {
              this.indent_to_tag('if');
              this.tag_type = 'HANDLEBARS_ELSE';
              this.indent_content = true;
              this.traverse_whitespace();
            }
          } else if (this.is_unformatted(tag_check, unformatted)) {
            // do not reformat the "unformatted" tags
            comment = this.get_unformatted('</' + tag_check + '>', tag_complete); //...delegate to get_unformatted function

            content.push(comment);
            tag_end = this.pos - 1;
            this.tag_type = 'SINGLE';
          } else if (tag_check === 'script' && (tag_complete.search('type') === -1 || tag_complete.search('type') > -1 && tag_complete.search(/\b(text|application)\/(x-)?(javascript|ecmascript|jscript|livescript)/) > -1)) {
            if (!peek) {
              this.record_tag(tag_check);
              this.tag_type = 'SCRIPT';
            }
          } else if (tag_check === 'style' && (tag_complete.search('type') === -1 || tag_complete.search('type') > -1 && tag_complete.search('text/css') > -1)) {
            if (!peek) {
              this.record_tag(tag_check);
              this.tag_type = 'STYLE';
            }
          } else if (tag_check.charAt(0) === '!') {
            //peek for <! comment
            // for comments content is already correct.
            if (!peek) {
              this.tag_type = 'SINGLE';
              this.traverse_whitespace();
            }
          } else if (!peek) {
            if (tag_check.charAt(0) === '/') {
              //this tag is a double tag so check for tag-ending
              this.retrieve_tag(tag_check.substring(1)); //remove it and all ancestors

              this.tag_type = 'END';
            } else {
              //otherwise it's a start-tag
              this.record_tag(tag_check); //push it on the tag stack

              if (tag_check.toLowerCase() != 'html') {
                this.indent_content = true;
              }

              this.tag_type = 'START';
            } // Allow preserving of newlines after a start or end tag


            if (this.traverse_whitespace()) {
              this.space_or_wrap(content);
            }

            if (this.Utils.in_array(tag_check, this.Utils.extra_liners)) {
              //check if this double needs an extra line
              this.print_newline(false, this.output);

              if (this.output.length && this.output[this.output.length - 2] != '\n') {
                this.print_newline(true, this.output);
              }
            }
          }

          if (peek) {
            this.pos = orig_pos;
            this.line_char_count = orig_line_char_count;
          }

          return content.join(''); //returns fully formatted tag
        };

        this.get_comment = function (start_pos) {
          //function to return comment content in its entirety
          // this is will have very poor perf, but will work for now.
          var comment = '',
              delimiter = '>',
              matched = false;
          this.pos = start_pos;
          var input_char = this.input.charAt(this.pos);
          this.pos++;

          while (this.pos <= this.input.length) {
            comment += input_char; // only need to check for the delimiter if the last chars match

            if (comment[comment.length - 1] === delimiter[delimiter.length - 1] && comment.indexOf(delimiter) != -1) {
              break;
            } // only need to search for custom delimiter for the first few characters


            if (!matched && comment.length < 10) {
              if (comment.indexOf('<![if') === 0) {
                //peek for <![if conditional comment
                delimiter = '<![endif]>';
                matched = true;
              } else if (comment.indexOf('<![cdata[') === 0) {
                //if it's a <[cdata[ comment...
                delimiter = ']]>';
                matched = true;
              } else if (comment.indexOf('<![') === 0) {
                // some other ![ comment? ...
                delimiter = ']>';
                matched = true;
              } else if (comment.indexOf('<!--') === 0) {
                // <!-- comment ...
                delimiter = '-->';
                matched = true;
              } else if (comment.indexOf('{{!') === 0) {
                // {{! handlebars comment
                delimiter = '}}';
                matched = true;
              } else if (comment.indexOf('<?') === 0) {
                // {{! handlebars comment
                delimiter = '?>';
                matched = true;
              } else if (comment.indexOf('<%') === 0) {
                // {{! handlebars comment
                delimiter = '%>';
                matched = true;
              }
            }

            input_char = this.input.charAt(this.pos);
            this.pos++;
          }

          return comment;
        };

        this.get_unformatted = function (delimiter, orig_tag) {
          //function to return unformatted content in its entirety
          if (orig_tag && orig_tag.toLowerCase().indexOf(delimiter) != -1) {
            return '';
          }

          var input_char = '';
          var content = '';
          var min_index = 0;
          var space = true;

          do {
            if (this.pos >= this.input.length) {
              return content;
            }

            input_char = this.input.charAt(this.pos);
            this.pos++;

            if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
              if (!space) {
                this.line_char_count--;
                continue;
              }

              if (input_char === '\n' || input_char === '\r') {
                content += '\n';
                /*  Don't change tab indention for unformatted blocks.  If using code for html editing, this will greatly affect <pre> tags if they are specified in the 'unformatted array'
                            for (const i=0  i<this.indent_level  i++) {
                              content += this.indent_string 
                            }
                            space = false  //...and make sure other indentation is erased
                            */

                this.line_char_count = 0;
                continue;
              }
            }

            content += input_char;
            this.line_char_count++;
            space = true;

            if (indent_handlebars && input_char === '{' && content.length && content[content.length - 2] === '{') {
              // Handlebars expressions in strings should also be unformatted.
              content += this.get_unformatted('}}'); // These expressions are opaque.  Ignore delimiters found in them.

              min_index = content.length;
            }
          } while (content.toLowerCase().indexOf(delimiter, min_index) === -1);

          return content;
        };

        this.get_token = function () {
          //initial handler for token-retrieval
          var token;

          if (this.last_token === 'TK_TAG_SCRIPT' || this.last_token === 'TK_TAG_STYLE') {
            //check if we need to format javascript
            var type = this.last_token.substr(7);
            token = this.get_contents_to(type);

            if (typeof token != 'string') {
              return token;
            }

            return [token, 'TK_' + type];
          }

          if (this.current_mode === 'CONTENT') {
            token = this.get_content();

            if (typeof token != 'string') {
              return token;
            } else {
              return [token, 'TK_CONTENT'];
            }
          }

          if (this.current_mode === 'TAG') {
            token = this.get_tag();

            if (typeof token != 'string') {
              return token;
            } else {
              var tag_name_type = 'TK_TAG_' + this.tag_type;
              return [token, tag_name_type];
            }
          }
        };

        this.get_full_indent = function (level) {
          level = this.indent_level + level || 0;

          if (level < 1) {
            return '';
          }

          return new Array(level + 1).join(this.indent_string);
        };

        this.is_unformatted = function (tag_check, unformatted) {
          //is this an HTML5 block-level link?
          if (!this.Utils.in_array(tag_check, unformatted)) {
            return false;
          }

          if (tag_check.toLowerCase() != 'a' || !this.Utils.in_array('a', unformatted)) {
            return true;
          } //at this point we have an  tag  is its first child something we want to remain
          //unformatted?


          var next_tag = this.get_tag(true
          /* peek. */
          ); // test next_tag to see if it is just html tag (no external content)

          var tag = (next_tag || '').match(/^\s*<\s*\/?([a-z]*)\s*[^>]*>\s*$/); // if next_tag comes back but is not an isolated tag, then
          // let's treat the 'a' tag as having content
          // and respect the unformatted option

          if (!tag || this.Utils.in_array(tag, unformatted)) {
            return true;
          } else {
            return false;
          }
        };

        this.printer = function (js_source, indent_character, indent_size, wrap_line_length, brace_style) {
          //handles input/output and some other printing functions
          this.input = js_source || ''; //gets the input for the Parser

          this.output = [];
          this.indent_character = indent_character;
          this.indent_string = '';
          this.indent_size = indent_size;
          this.brace_style = brace_style;
          this.indent_level = 0;
          this.wrap_line_length = wrap_line_length;
          this.line_char_count = 0; //count to see if wrap_line_length was exceeded

          for (var i = 0; i < this.indent_size; i++) {
            this.indent_string += this.indent_character;
          }

          this.print_newline = function (force, arr) {
            this.line_char_count = 0;

            if (!arr || !arr.length) {
              return;
            }

            if (force || arr[arr.length - 1] != '\n') {
              //we might want the extra line
              if (arr[arr.length - 1] != '\n') {
                arr[arr.length - 1] = rtrim(arr[arr.length - 1]);
              }

              arr.push('\n');
            }
          };

          this.print_indentation = function (arr) {
            for (var _i = 0; _i < this.indent_level; _i++) {
              arr.push(this.indent_string);
              this.line_char_count += this.indent_string.length;
            }
          };

          this.print_token = function (text) {
            // Avoid printing initial whitespace.
            if (this.is_whitespace(text) && !this.output.length) {
              return;
            }

            if (text || text !== '') {
              if (this.output.length && this.output[this.output.length - 1] === '\n') {
                this.print_indentation(this.output);
                text = ltrim(text);
              }
            }

            this.print_token_raw(text);
          };

          this.print_token_raw = function (text) {
            // If we are going to print newlines, truncate trailing
            // whitespace, as the newlines will represent the space.
            if (this.newlines > 0) {
              text = rtrim(text);
            }

            if (text && text !== '') {
              if (text.length > 1 && text[text.length - 1] === '\n') {
                // unformatted tags can grab newlines as their last character
                this.output.push(text.slice(0, -1));
                this.print_newline(false, this.output);
              } else {
                this.output.push(text);
              }
            }

            for (var n = 0; n < this.newlines; n++) {
              this.print_newline(n > 0, this.output);
            }

            this.newlines = 0;
          };

          this.indent = function () {
            this.indent_level++;
          };

          this.unindent = function () {
            if (this.indent_level > 0) {
              this.indent_level--;
            }
          };
        };

        return this;
      }
      /*_____________________--------------------_____________________*/


      multi_parser = new Parser(); //wrapping functions Parser

      multi_parser.printer(html_source, indent_character, indent_size, wrap_line_length, brace_style); //initialize starting values

      while (true) {
        var t = multi_parser.get_token();
        multi_parser.token_text = t[0];
        multi_parser.token_type = t[1];

        if (multi_parser.token_type === 'TK_EOF') {
          break;
        }

        switch (multi_parser.token_type) {
          case 'TK_TAG_START':
            multi_parser.print_newline(false, multi_parser.output);
            multi_parser.print_token(multi_parser.token_text);

            if (multi_parser.indent_content) {
              multi_parser.indent();
              multi_parser.indent_content = false;
            }

            multi_parser.current_mode = 'CONTENT';
            break;

          case 'TK_TAG_STYLE':
          case 'TK_TAG_SCRIPT':
            multi_parser.print_newline(false, multi_parser.output);
            multi_parser.print_token(multi_parser.token_text);
            multi_parser.current_mode = 'CONTENT';
            break;

          case 'TK_TAG_END':
            // Print new line only if the tag has no content and has child
            if (multi_parser.last_token === 'TK_CONTENT' && multi_parser.last_text === '') {
              var tag_name = multi_parser.token_text.match(/\w+/)[0];
              var tag_extracted_from_last_output = null;

              if (multi_parser.output.length) {
                tag_extracted_from_last_output = multi_parser.output[multi_parser.output.length - 1].match(/(?:<|{{#)\/?\s*(\w+)/);
              }

              if (tag_extracted_from_last_output === null || tag_extracted_from_last_output[1] != tag_name && !multi_parser.Utils.in_array(tag_extracted_from_last_output[1], unformatted)) {
                multi_parser.print_newline(false, multi_parser.output);
              }
            }

            multi_parser.print_token(multi_parser.token_text);
            multi_parser.current_mode = 'CONTENT';
            break;

          case 'TK_TAG_SINGLE':
            // Don't add a newline before elements that should remain unformatted.
            var tag_check = multi_parser.token_text.match(/^\s*<([a-z-]+)/i);

            if (!tag_check || !multi_parser.Utils.in_array(tag_check[1], unformatted)) {
              multi_parser.print_newline(false, multi_parser.output);
            }

            multi_parser.print_token(multi_parser.token_text);
            multi_parser.current_mode = 'CONTENT';
            break;

          case 'TK_TAG_HANDLEBARS_ELSE':
            multi_parser.print_token(multi_parser.token_text);

            if (multi_parser.indent_content) {
              multi_parser.indent();
              multi_parser.indent_content = false;
            }

            multi_parser.current_mode = 'CONTENT';
            break;

          case 'TK_TAG_HANDLEBARS_COMMENT':
            multi_parser.print_token(multi_parser.token_text);
            multi_parser.current_mode = 'TAG';
            break;

          case 'TK_CONTENT':
            multi_parser.print_token(multi_parser.token_text);
            multi_parser.current_mode = 'TAG';
            break;

          case 'TK_STYLE':
          case 'TK_SCRIPT':
            if (multi_parser.token_text !== '') {
              multi_parser.print_newline(false, multi_parser.output);
              var text = multi_parser.token_text;

              var _beautifier = void 0;

              var script_indent_level = 1;

              if (multi_parser.token_type === 'TK_SCRIPT') {
                _beautifier = typeof js_beautify === 'function' && js_beautify;
              } else if (multi_parser.token_type === 'TK_STYLE') {
                _beautifier = typeof css_beautify === 'function' && css_beautify;
              }

              if (options.indent_scripts === 'keep') {
                script_indent_level = 0;
              } else if (options.indent_scripts === 'separate') {
                script_indent_level = -multi_parser.indent_level;
              }

              var indentation = multi_parser.get_full_indent(script_indent_level);

              if (_beautifier) {
                // call the Beautifier if avaliable
                text = _beautifier(text.replace(/^\s*/, indentation), options);
              } else {
                // simply indent the string otherwise
                var white = text.match(/^\s*/)[0];

                var _level = white.match(/[^\n\r]*$/)[0].split(multi_parser.indent_string).length - 1;

                var reindent = multi_parser.get_full_indent(script_indent_level - _level);
                text = text.replace(/^\s*/, indentation).replace(/\r\n|\r|\n/g, '\n' + reindent).replace(/\s+$/, '');
              }

              if (text) {
                multi_parser.print_token_raw(text);
                multi_parser.print_newline(true, multi_parser.output);
              }
            }

            multi_parser.current_mode = 'TAG';
            break;

          default:
            // We should not be getting here but we don't want to drop input on the floor
            // Just output the text and move on
            if (multi_parser.token_text !== '') {
              multi_parser.print_token(multi_parser.token_text);
            }

            break;
        }

        multi_parser.last_token = multi_parser.token_type;
        multi_parser.last_text = multi_parser.token_text;
      }

      var sweet_code = multi_parser.output.join('').replace(/[\r\n\t ]+$/, '');

      if (end_with_newline) {
        sweet_code += '\n';
      }

      return sweet_code;
    }

    function css_beautify(source_text, options) {
      var NESTED_AT_RULE = {
        '@page': true,
        '@font-face': true,
        '@keyframes': true,
        // also in CONDITIONAL_GROUP_RULE below
        '@media': true,
        '@supports': true,
        '@document': true
      };
      var CONDITIONAL_GROUP_RULE = {
        '@media': true,
        '@supports': true,
        '@document': true
      };
      options = options || {};
      source_text = source_text || ''; // HACK: newline parsing inconsistent. This brute force normalizes the input.

      source_text = source_text.replace(/\r\n|[\r\u2028\u2029]/g, '\n');
      var indentSize = options.indent_size || 4;
      var indentCharacter = options.indent_char || ' ';
      var selectorSeparatorNewline = options.selector_separator_newline === undefined ? true : options.selector_separator_newline;
      var end_with_newline = options.end_with_newline === undefined ? false : options.end_with_newline;
      var newline_between_rules = options.newline_between_rules === undefined ? true : options.newline_between_rules;
      var eol = options.eol ? options.eol : '\n'; // compatibility

      if (typeof indentSize === 'string') {
        indentSize = parseInt(indentSize, 10);
      }

      if (options.indent_with_tabs) {
        indentCharacter = '\t';
        indentSize = 1;
      }

      eol = eol.replace(/\\r/, '\r').replace(/\\n/, '\n'); // tokenizer

      var whiteRe = /^\s+$/;
      var pos = -1,
          ch;
      var parenLevel = 0;

      function next() {
        ch = source_text.charAt(++pos);
        return ch || '';
      }

      function peek(skipWhitespace) {
        var result = '';
        var prev_pos = pos;

        if (skipWhitespace) {
          eatWhitespace();
        }

        result = source_text.charAt(pos + 1) || '';
        pos = prev_pos - 1;
        next();
        return result;
      }

      function eatString(endChars) {
        var start = pos;

        while (next()) {
          if (ch === '\\') {
            next();
          } else if (endChars.indexOf(ch) !== -1) {
            break;
          } else if (ch === '\n') {
            break;
          }
        }

        return source_text.substring(start, pos + 1);
      }

      function peekString(endChar) {
        var prev_pos = pos;
        var str = eatString(endChar);
        pos = prev_pos - 1;
        next();
        return str;
      }

      function eatWhitespace() {
        var result = '';

        while (whiteRe.test(peek())) {
          next();
          result += ch;
        }

        return result;
      }

      function skipWhitespace() {
        var result = '';

        if (ch && whiteRe.test(ch)) {
          result = ch;
        }

        while (whiteRe.test(next())) {
          result += ch;
        }

        return result;
      }

      function eatComment(singleLine) {
        var start = pos;
        singleLine = peek() === '/';
        next();

        while (next()) {
          if (!singleLine && ch === '*' && peek() === '/') {
            next();
            break;
          } else if (singleLine && ch === '\n') {
            return source_text.substring(start, pos);
          }
        }

        return source_text.substring(start, pos) + ch;
      }

      function lookBack(str) {
        return source_text.substring(pos - str.length, pos).toLowerCase() === str;
      } // Nested pseudo-class if we are insideRule
      // and the next special character found opens
      // a new block


      function foundNestedPseudoClass() {
        var openParen = 0;

        for (var i = pos + 1; i < source_text.length; i++) {
          var _ch = source_text.charAt(i);

          if (_ch === '{') {
            return true;
          } else if (_ch === '(') {
            // pseudoclasses can contain ()
            openParen += 1;
          } else if (_ch === ')') {
            if (openParen === 0) {
              return false;
            }

            openParen -= 1;
          } else if (_ch === ' ' || _ch === '}') {
            return false;
          }
        }

        return false;
      } // printer


      var basebaseIndentString = source_text.match(/^[\t ]*/)[0];
      var singleIndent = new Array(indentSize + 1).join(indentCharacter);
      var indentLevel = 0;
      var nestedLevel = 0;

      function indent() {
        indentLevel++;
        basebaseIndentString += singleIndent;
      }

      function outdent() {
        indentLevel--;
        basebaseIndentString = basebaseIndentString.slice(0, -indentSize);
      }

      var print = {};

      print['{'] = function (ch) {
        print.singleSpace();
        output.push(ch);
        print.newLine();
      };

      print['}'] = function (ch) {
        print.newLine();
        output.push(ch);
        print.newLine();
      };

      print._lastCharWhitespace = function () {
        return whiteRe.test(output[output.length - 1]);
      };

      print.newLine = function (keepWhitespace) {
        if (output.length) {
          if (!keepWhitespace && output[output.length - 1] !== '\n') {
            print.trim();
          }

          output.push('\n');

          if (basebaseIndentString) {
            output.push(basebaseIndentString);
          }
        }
      };

      print.singleSpace = function () {
        if (output.length && !print._lastCharWhitespace()) {
          output.push(' ');
        }
      };

      print.preserveSingleSpace = function () {
        if (isAfterSpace) {
          print.singleSpace();
        }
      };

      print.trim = function () {
        while (print._lastCharWhitespace()) {
          output.pop();
        }
      };

      var output = [];
      /*_____________________--------------------_____________________*/

      var insideRule = false;
      var insidePropertyValue = false;
      var enteringConditionalGroup = false;
      var top_ch = '';
      var last_top_ch = '';
      var isAfterSpace;

      while (true) {
        var whitespace = skipWhitespace();
        isAfterSpace = whitespace !== '';
        var isAfterNewline = whitespace.indexOf('\n') !== -1;
        last_top_ch = top_ch;
        top_ch = ch;

        if (!ch) {
          break;
        } else if (ch === '/' && peek() === '*') {
          /* css comment */
          var header = indentLevel === 0;

          if (isAfterNewline || header) {
            print.newLine();
          }

          output.push(eatComment());
          print.newLine();

          if (header) {
            print.newLine(true);
          }
        } else if (ch === '/' && peek() === '/') {
          // single line comment
          if (!isAfterNewline && last_top_ch !== '{') {
            print.trim();
          }

          print.singleSpace();
          output.push(eatComment());
          print.newLine();
        } else if (ch === '@') {
          print.preserveSingleSpace();
          output.push(ch); // strip trailing space, if present, for hash property checks

          var variableOrRule = peekString(': , {}()[]/=\'"');

          if (variableOrRule.match(/[ :]$/)) {
            // we have a variable or pseudo-class, add it and insert one space before continuing
            next();
            variableOrRule = eatString(': ').replace(/\s$/, '');
            output.push(variableOrRule);
            print.singleSpace();
          }

          variableOrRule = variableOrRule.replace(/\s$/, ''); // might be a nesting at-rule

          if (variableOrRule in NESTED_AT_RULE) {
            nestedLevel += 1;

            if (variableOrRule in CONDITIONAL_GROUP_RULE) {
              enteringConditionalGroup = true;
            }
          }
        } else if (ch === '#' && peek() === '{') {
          print.preserveSingleSpace();
          output.push(eatString('}'));
        } else if (ch === '{') {
          if (peek(true) === '}') {
            eatWhitespace();
            next();
            print.singleSpace();
            output.push('{}');
            print.newLine();

            if (newline_between_rules && indentLevel === 0) {
              print.newLine(true);
            }
          } else {
            indent();
            print['{'](ch); // when entering conditional groups, only rulesets are allowed

            if (enteringConditionalGroup) {
              enteringConditionalGroup = false;
              insideRule = indentLevel > nestedLevel;
            } else {
              // otherwise, declarations are also allowed
              insideRule = indentLevel >= nestedLevel;
            }
          }
        } else if (ch === '}') {
          outdent();
          print['}'](ch);
          insideRule = false;
          insidePropertyValue = false;

          if (nestedLevel) {
            nestedLevel--;
          }

          if (newline_between_rules && indentLevel === 0) {
            print.newLine(true);
          }
        } else if (ch === ':') {
          eatWhitespace();

          if ((insideRule || enteringConditionalGroup) && !(lookBack('&') || foundNestedPseudoClass())) {
            // 'property: value' delimiter
            // which could be in a conditional group query
            insidePropertyValue = true;
            output.push(':');
            print.singleSpace();
          } else {
            // sass/less parent reference don't use a space
            // sass nested pseudo-class don't use a space
            if (peek() === ':') {
              // pseudo-element
              next();
              output.push('::');
            } else {
              // pseudo-class
              output.push(':');
            }
          }
        } else if (ch === '"' || ch === '\'') {
          print.preserveSingleSpace();
          output.push(eatString(ch));
        } else if (ch === ' ') {
          insidePropertyValue = false;
          output.push(ch);
          print.newLine();
        } else if (ch === '(') {
          // may be a url
          if (lookBack('url')) {
            output.push(ch);
            eatWhitespace();

            if (next()) {
              if (ch !== ')' && ch !== '"' && ch !== '\'') {
                output.push(eatString(')'));
              } else {
                pos--;
              }
            }
          } else {
            parenLevel++;
            print.preserveSingleSpace();
            output.push(ch);
            eatWhitespace();
          }
        } else if (ch === ')') {
          output.push(ch);
          parenLevel--;
        } else if (ch === ',') {
          output.push(ch);
          eatWhitespace();

          if (selectorSeparatorNewline && !insidePropertyValue && parenLevel < 1) {
            print.newLine();
          } else {
            print.singleSpace();
          }
        } else if (ch === ']') {
          output.push(ch);
        } else if (ch === '[') {
          print.preserveSingleSpace();
          output.push(ch);
        } else if (ch === '=') {
          // no whitespace before or after
          eatWhitespace();
          ch = '=';
          output.push(ch);
        } else {
          print.preserveSingleSpace();
          output.push(ch);
        }
      }

      var sweetCode = '';

      if (basebaseIndentString) {
        sweetCode += basebaseIndentString;
      }

      sweetCode += output.join('').replace(/[\r\n\t ]+$/, ''); // establish end_with_newline

      if (end_with_newline) {
        sweetCode += '\n';
      }

      if (eol != '\n') {
        sweetCode = sweetCode.replace(/[\n]/g, eol);
      }

      return sweetCode;
    }

    function in_array(what, arr) {
      for (var i = 0; i < arr.length; i += 1) {
        if (arr[i] === what) {
          return true;
        }
      }

      return false;
    }

    function trim(s) {
      return s.replace(/^\s+|\s+$/g, '');
    }

    function ltrim(s) {
      return s.replace(/^\s+/g, '');
    }

    function js_beautify(js_source_text, options) {

      var beautifier = new Beautifier(js_source_text, options);
      return beautifier.beautify();
    }

    var MODE = {
      BlockStatement: 'BlockStatement',
      // 'BLOCK'
      Statement: 'Statement',
      // 'STATEMENT'
      ObjectLiteral: 'ObjectLiteral',
      // 'OBJECT',
      ArrayLiteral: 'ArrayLiteral',
      //'[EXPRESSION]',
      ForInitializer: 'ForInitializer',
      //'(FOR-EXPRESSION)',
      Conditional: 'Conditional',
      //'(COND-EXPRESSION)',
      Expression: 'Expression' //'(EXPRESSION)'

    };

    function Beautifier(js_source_text, options) {

      var output;
      var tokens = [],
          token_pos;
      var Tokenizer;
      var current_token;
      var last_type, last_last_text, indent_string;
      var flags, previous_flags, flag_store;
      var prefix;
      var handlers, opt;
      var baseIndentString = '';
      handlers = {
        'TK_START_EXPR': handle_start_expr,
        'TK_END_EXPR': handle_end_expr,
        'TK_START_BLOCK': handle_start_block,
        'TK_END_BLOCK': handle_end_block,
        'TK_WORD': handle_word,
        'TK_RESERVED': handle_word,
        'TK_SEMICOLON': handle_semicolon,
        'TK_STRING': handle_string,
        'TK_EQUALS': handle_equals,
        'TK_OPERATOR': handle_operator,
        'TK_COMMA': handle_comma,
        'TK_BLOCK_COMMENT': handle_block_comment,
        'TK_COMMENT': handle_comment,
        'TK_DOT': handle_dot,
        'TK_UNKNOWN': handle_unknown,
        'TK_EOF': handle_eof
      };

      function create_flags(flags_base, mode) {
        var next_indent_level = 0;

        if (flags_base) {
          next_indent_level = flags_base.indentation_level;

          if (!output.just_added_newline() && flags_base.line_indent_level > next_indent_level) {
            next_indent_level = flags_base.line_indent_level;
          }
        }

        var next_flags = {
          mode: mode,
          parent: flags_base,
          last_text: flags_base ? flags_base.last_text : '',
          // last token text
          last_word: flags_base ? flags_base.last_word : '',
          // last 'TK_WORD' passed
          declaration_statement: false,
          declaration_assignment: false,
          multiline_frame: false,
          if_block: false,
          else_block: false,
          do_block: false,
          do_while: false,
          in_case_statement: false,
          // switch(..){ INSIDE HERE }
          in_case: false,
          // we're on the exact line with "case 0:"
          case_body: false,
          // the indented case-action block
          indentation_level: next_indent_level,
          line_indent_level: flags_base ? flags_base.line_indent_level : next_indent_level,
          start_line_index: output.get_line_number(),
          ternary_depth: 0
        };
        return next_flags;
      } // Some interpreters have unexpected results with foo = baz || bar 


      options = options ? options : {};
      opt = {}; // compatibility

      if (options.braces_on_own_line !== undefined) {
        //graceful handling of deprecated option
        opt.brace_style = options.braces_on_own_line ? 'expand' : 'collapse';
      }

      opt.brace_style = options.brace_style ? options.brace_style : opt.brace_style ? opt.brace_style : 'collapse'; // graceful handling of deprecated option

      if (opt.brace_style === 'expand-strict') {
        opt.brace_style = 'expand';
      }

      opt.indent_size = options.indent_size ? parseInt(options.indent_size, 10) : 4;
      opt.indent_char = options.indent_char ? options.indent_char : ' ';
      opt.eol = options.eol ? options.eol : '\n';
      opt.preserve_newlines = options.preserve_newlines === undefined ? true : options.preserve_newlines;
      opt.break_chained_methods = options.break_chained_methods === undefined ? false : options.break_chained_methods;
      opt.max_preserve_newlines = options.max_preserve_newlines === undefined ? 0 : parseInt(options.max_preserve_newlines, 10);
      opt.space_in_paren = options.space_in_paren === undefined ? false : options.space_in_paren;
      opt.space_in_empty_paren = options.space_in_empty_paren === undefined ? false : options.space_in_empty_paren;
      opt.jslint_happy = options.jslint_happy === undefined ? false : options.jslint_happy;
      opt.space_after_anon_function = options.space_after_anon_function === undefined ? false : options.space_after_anon_function;
      opt.keep_array_indentation = options.keep_array_indentation === undefined ? false : options.keep_array_indentation;
      opt.space_before_conditional = options.space_before_conditional === undefined ? true : options.space_before_conditional;
      opt.unescape_strings = options.unescape_strings === undefined ? false : options.unescape_strings;
      opt.wrap_line_length = options.wrap_line_length === undefined ? 0 : parseInt(options.wrap_line_length, 10);
      opt.e4x = options.e4x === undefined ? false : options.e4x;
      opt.end_with_newline = options.end_with_newline === undefined ? false : options.end_with_newline;
      opt.comma_first = options.comma_first === undefined ? false : options.comma_first; // For testing of beautify ignore:start directive

      opt.test_output_raw = options.test_output_raw === undefined ? false : options.test_output_raw; // force opt.space_after_anon_function to true if opt.jslint_happy

      if (opt.jslint_happy) {
        opt.space_after_anon_function = true;
      }

      if (options.indent_with_tabs) {
        opt.indent_char = '\t';
        opt.indent_size = 1;
      }

      opt.eol = opt.eol.replace(/\\r/, '\r').replace(/\\n/, '\n'); //----------------------------------

      indent_string = '';

      while (opt.indent_size > 0) {
        indent_string += opt.indent_char;
        opt.indent_size -= 1;
      }

      var preindent_index = 0;

      if (js_source_text && js_source_text.length) {
        while (js_source_text.charAt(preindent_index) === ' ' || js_source_text.charAt(preindent_index) === '\t') {
          baseIndentString += js_source_text.charAt(preindent_index);
          preindent_index += 1;
        }

        js_source_text = js_source_text.substring(preindent_index);
      }

      last_type = 'TK_START_BLOCK'; // last token type

      last_last_text = ''; // pre-last token text

      output = new Output(indent_string, baseIndentString); // If testing the ignore directive, start with output disable set to true

      output.raw = opt.test_output_raw; // Stack of parsing/formatting states, including MODE.
      // We tokenize, parse, and output in an almost purely a forward-only stream of token input
      // and formatted output.  This makes the beautifier less accurate than full parsers
      // but also far more tolerant of syntax errors.
      //
      // For example, the default mode is MODE.BlockStatement. If we see a '{' we push a new frame of type
      // MODE.BlockStatement on the the stack, even though it could be object literal.  If we later
      // encounter a ":", we'll switch to to MODE.ObjectLiteral.  If we then see a " ",
      // most full parsers would die, but the beautifier gracefully falls back to
      // MODE.BlockStatement and continues on.

      flag_store = [];
      set_mode(MODE.BlockStatement);

      this.beautify = function () {
        /*jshint onevar:true */
        var local_token, sweet_code;
        Tokenizer = new tokenizer(js_source_text, opt, indent_string);
        tokens = Tokenizer.tokenize();
        token_pos = 0;

        while (local_token = get_token()) {
          for (var i = 0; i < local_token.comments_before.length; i++) {
            // The cleanest handling of inline comments is to treat them as though they aren't there.
            // Just continue formatting and the behavior should be logical.
            // Also ignore unknown tokens.  Again, this should result in better behavior.
            handle_token(local_token.comments_before[i]);
          }

          handle_token(local_token);
          last_last_text = flags.last_text;
          last_type = local_token.type;
          flags.last_text = local_token.text;
          token_pos += 1;
        }

        sweet_code = output.get_code();

        if (opt.end_with_newline) {
          sweet_code += '\n';
        }

        if (opt.eol != '\n') {
          sweet_code = sweet_code.replace(/[\n]/g, opt.eol);
        }

        return sweet_code;
      };

      function handle_token(local_token) {
        var newlines = local_token.newlines;
        var keep_whitespace = opt.keep_array_indentation && is_array(flags.mode);

        if (keep_whitespace) {
          for (var i = 0; i < newlines; i += 1) {
            print_newline(i > 0);
          }
        } else {
          if (opt.max_preserve_newlines && newlines > opt.max_preserve_newlines) {
            newlines = opt.max_preserve_newlines;
          }

          if (opt.preserve_newlines) {
            if (local_token.newlines > 1) {
              print_newline();

              for (var _i2 = 1; _i2 < newlines; _i2 += 1) {
                print_newline(true);
              }
            }
          }
        }

        current_token = local_token;
        handlers[current_token.type]();
      } // we could use just string.split, but
      // IE doesn't like returning empty strings


      function split_newlines(s) {
        //return s.split(/\x0d\x0a|\x0a/) 
        var idx;
        s = s.replace(/\x0d/g, '');
        var out = [];
        idx = s.indexOf('\n');

        while (idx !== -1) {
          out.push(s.substring(0, idx));
          s = s.substring(idx + 1);
          idx = s.indexOf('\n');
        }

        if (s.length) {
          out.push(s);
        }

        return out;
      }

      function allow_wrap_or_preserved_newline(force_linewrap) {
        force_linewrap = force_linewrap === undefined ? false : force_linewrap; // Never wrap the first token on a line

        if (output.just_added_newline()) {
          return;
        }

        if (opt.preserve_newlines && current_token.wanted_newline || force_linewrap) {
          print_newline(false, true);
        } else if (opt.wrap_line_length) {
          var proposed_line_length = output.current_line.get_character_count() + current_token.text.length + (output.space_before_token ? 1 : 0);

          if (proposed_line_length >= opt.wrap_line_length) {
            print_newline(false, true);
          }
        }
      }

      function print_newline(force_newline, preserve_statement_flags) {
        if (!preserve_statement_flags) {
          if (flags.last_text !== ' ' && flags.last_text !== ',' && flags.last_text !== '=' && last_type !== 'TK_OPERATOR') {
            while (flags.mode === MODE.Statement && !flags.if_block && !flags.do_block) {
              restore_mode();
            }
          }
        }

        if (output.add_new_line(force_newline)) {
          flags.multiline_frame = true;
        }
      }

      function print_token_line_indentation() {
        if (output.just_added_newline()) {
          if (opt.keep_array_indentation && is_array(flags.mode) && current_token.wanted_newline) {
            output.current_line.push(current_token.whitespace_before);
            output.space_before_token = false;
          } else if (output.set_indent(flags.indentation_level)) {
            flags.line_indent_level = flags.indentation_level;
          }
        }
      }

      function print_token(printable_token) {
        if (output.raw) {
          output.add_raw_token(current_token);
          return;
        }

        if (opt.comma_first && last_type === 'TK_COMMA' && output.just_added_newline()) {
          if (output.previous_line.last() === ',') {
            output.previous_line.pop();
            print_token_line_indentation();
            output.add_token(',');
            output.space_before_token = true;
          }
        }

        printable_token = printable_token || current_token.text;
        print_token_line_indentation();
        output.add_token(printable_token);
      }

      function indent() {
        flags.indentation_level += 1;
      }

      function deindent() {
        if (flags.indentation_level > 0 && (!flags.parent || flags.indentation_level > flags.parent.indentation_level)) flags.indentation_level -= 1;
      }

      function set_mode(mode) {
        if (flags) {
          flag_store.push(flags);
          previous_flags = flags;
        } else {
          previous_flags = create_flags(null, mode);
        }

        flags = create_flags(previous_flags, mode);
      }

      function is_array(mode) {
        return mode === MODE.ArrayLiteral;
      }

      function is_expression(mode) {
        return in_array(mode, [MODE.Expression, MODE.ForInitializer, MODE.Conditional]);
      }

      function restore_mode() {
        if (flag_store.length > 0) {
          previous_flags = flags;
          flags = flag_store.pop();

          if (previous_flags.mode === MODE.Statement) {
            output.remove_redundant_indentation(previous_flags);
          }
        }
      }

      function start_of_object_property() {
        return flags.parent.mode === MODE.ObjectLiteral && flags.mode === MODE.Statement && (flags.last_text === ':' && flags.ternary_depth === 0 || last_type === 'TK_RESERVED' && in_array(flags.last_text, ['get', 'set']));
      }

      function start_of_statement() {
        if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['const', 'let', 'const']) && current_token.type === 'TK_WORD' || last_type === 'TK_RESERVED' && flags.last_text === 'do' || last_type === 'TK_RESERVED' && flags.last_text === 'return' && !current_token.wanted_newline || last_type === 'TK_RESERVED' && flags.last_text === 'else' && !(current_token.type === 'TK_RESERVED' && current_token.text === 'if') || last_type === 'TK_END_EXPR' && (previous_flags.mode === MODE.ForInitializer || previous_flags.mode === MODE.Conditional) || last_type === 'TK_WORD' && flags.mode === MODE.BlockStatement && !flags.in_case && !(current_token.text === '--' || current_token.text === '++') && last_last_text !== 'function' && current_token.type !== 'TK_WORD' && current_token.type !== 'TK_RESERVED' || flags.mode === MODE.ObjectLiteral && (flags.last_text === ':' && flags.ternary_depth === 0 || last_type === 'TK_RESERVED' && in_array(flags.last_text, ['get', 'set']))) {
          set_mode(MODE.Statement);
          indent();

          if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['const', 'let', 'const']) && current_token.type === 'TK_WORD') {
            flags.declaration_statement = true;
          } // Issue #276:
          // If starting a new statement with [if, for, while, do], push to a new line.
          // if (a) if (b) if(c) d()  else e()  else f() 


          if (!start_of_object_property()) {
            allow_wrap_or_preserved_newline(current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['do', 'for', 'if', 'while']));
          }

          return true;
        }

        return false;
      }

      function all_lines_start_with(lines, c) {
        for (var i = 0; i < lines.length; i++) {
          var line = trim(lines[i]);

          if (line.charAt(0) !== c) {
            return false;
          }
        }

        return true;
      }

      function each_line_matches_indent(lines, indent) {
        var i = 0,
            len = lines.length,
            line;

        for (; i < len; i++) {
          line = lines[i]; // allow empty lines to pass through

          if (line && line.indexOf(indent) !== 0) {
            return false;
          }
        }

        return true;
      }

      function is_special_word(word) {
        return in_array(word, ['case', 'return', 'do', 'if', 'throw', 'else']);
      }

      function get_token(offset) {
        var index = token_pos + (offset || 0);
        return index < 0 || index >= tokens.length ? null : tokens[index];
      }

      function handle_start_expr() {
        if (start_of_statement()) ;

        var next_mode = MODE.Expression;

        if (current_token.text === '[') {
          if (last_type === 'TK_WORD' || flags.last_text === ')') {
            // this is array index specifier, break immediately
            // a[x], fn()[x]
            if (last_type === 'TK_RESERVED' && in_array(flags.last_text, Tokenizer.line_starters)) {
              output.space_before_token = true;
            }

            set_mode(next_mode);
            print_token();
            indent();

            if (opt.space_in_paren) {
              output.space_before_token = true;
            }

            return;
          }

          next_mode = MODE.ArrayLiteral;

          if (is_array(flags.mode)) {
            if (flags.last_text === '[' || flags.last_text === ',' && (last_last_text === ']' || last_last_text === '}')) {
              // ], [ goes to new line
              // }, [ goes to new line
              if (!opt.keep_array_indentation) {
                print_newline();
              }
            }
          }
        } else {
          if (last_type === 'TK_RESERVED' && flags.last_text === 'for') {
            next_mode = MODE.ForInitializer;
          } else if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['if', 'while'])) {
            next_mode = MODE.Conditional;
          }
        }

        if (flags.last_text === ' ' || last_type === 'TK_START_BLOCK') {
          print_newline();
        } else if (last_type === 'TK_END_EXPR' || last_type === 'TK_START_EXPR' || last_type === 'TK_END_BLOCK' || flags.last_text === '.') {
          // TODO: Consider whether forcing this is required.  Review failing tests when removed.
          allow_wrap_or_preserved_newline(current_token.wanted_newline); // do nothing on (( and )( and ][ and ]( and .(
        } else if (!(last_type === 'TK_RESERVED' && current_token.text === '(') && last_type !== 'TK_WORD' && last_type !== 'TK_OPERATOR') {
          output.space_before_token = true;
        } else if (last_type === 'TK_RESERVED' && (flags.last_word === 'function' || flags.last_word === 'typeof') || flags.last_text === '*' && last_last_text === 'function') {
          // function() vs function ()
          if (opt.space_after_anon_function) {
            output.space_before_token = true;
          }
        } else if (last_type === 'TK_RESERVED' && (in_array(flags.last_text, Tokenizer.line_starters) || flags.last_text === 'catch')) {
          if (opt.space_before_conditional) {
            output.space_before_token = true;
          }
        } // Should be a space between await and an IIFE


        if (current_token.text === '(' && last_type === 'TK_RESERVED' && flags.last_word === 'await') {
          output.space_before_token = true;
        } // Support of this kind of newline preservation.
        // a = (b &&
        //     (c || d)) 


        if (current_token.text === '(') {
          if (last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
            if (!start_of_object_property()) {
              allow_wrap_or_preserved_newline();
            }
          }
        }

        set_mode(next_mode);
        print_token();

        if (opt.space_in_paren) {
          output.space_before_token = true;
        } // In all cases, if we newline while inside an expression it should be indented.


        indent();
      }

      function handle_end_expr() {
        // statements inside expressions are not valid syntax, but...
        // statements must all be closed when their container closes
        while (flags.mode === MODE.Statement) {
          restore_mode();
        }

        if (flags.multiline_frame) {
          allow_wrap_or_preserved_newline(current_token.text === ']' && is_array(flags.mode) && !opt.keep_array_indentation);
        }

        if (opt.space_in_paren) {
          if (last_type === 'TK_START_EXPR' && !opt.space_in_empty_paren) {
            // () [] no inner space in empty parens like these, ever, ref #320
            output.trim();
            output.space_before_token = false;
          } else {
            output.space_before_token = true;
          }
        }

        if (current_token.text === ']' && opt.keep_array_indentation) {
          print_token();
          restore_mode();
        } else {
          restore_mode();
          print_token();
        }

        output.remove_redundant_indentation(previous_flags); // do {} while () // no statement required after

        if (flags.do_while && previous_flags.mode === MODE.Conditional) {
          previous_flags.mode = MODE.Expression;
          flags.do_block = false;
          flags.do_while = false;
        }
      }

      function handle_start_block() {
        // Check if this is should be treated as a ObjectLiteral
        var next_token = get_token(1);
        var second_token = get_token(2);

        if (second_token && (second_token.text === ':' && in_array(next_token.type, ['TK_STRING', 'TK_WORD', 'TK_RESERVED']) || in_array(next_token.text, ['get', 'set']) && in_array(second_token.type, ['TK_WORD', 'TK_RESERVED']))) {
          // We don't support TypeScript,but we didn't break it for a very long time.
          // We'll try to keep not breaking it.
          if (!in_array(last_last_text, ['class', 'interface'])) {
            set_mode(MODE.ObjectLiteral);
          } else {
            set_mode(MODE.BlockStatement);
          }
        } else {
          set_mode(MODE.BlockStatement);
        }

        var empty_braces = !next_token.comments_before.length && next_token.text === '}';
        var empty_anonymous_function = empty_braces && flags.last_word === 'function' && last_type === 'TK_END_EXPR';

        if (opt.brace_style === 'expand' || opt.brace_style === 'none' && current_token.wanted_newline) {
          if (last_type !== 'TK_OPERATOR' && (empty_anonymous_function || last_type === 'TK_EQUALS' || last_type === 'TK_RESERVED' && is_special_word(flags.last_text) && flags.last_text !== 'else')) {
            output.space_before_token = true;
          } else {
            print_newline(false, true);
          }
        } else {
          // collapse
          if (last_type !== 'TK_OPERATOR' && last_type !== 'TK_START_EXPR') {
            if (last_type === 'TK_START_BLOCK') {
              print_newline();
            } else {
              output.space_before_token = true;
            }
          } else {
            // if TK_OPERATOR or TK_START_EXPR
            if (is_array(previous_flags.mode) && flags.last_text === ',') {
              if (last_last_text === '}') {
                // }, { in array context
                output.space_before_token = true;
              } else {
                print_newline(); // [a, b, c, {
              }
            }
          }
        }

        print_token();
        indent();
      }

      function handle_end_block() {
        // statements must all be closed when their container closes
        while (flags.mode === MODE.Statement) {
          restore_mode();
        }

        var empty_braces = last_type === 'TK_START_BLOCK';

        if (opt.brace_style === 'expand') {
          if (!empty_braces) {
            print_newline();
          }
        } else {
          // skip {}
          if (!empty_braces) {
            if (is_array(flags.mode) && opt.keep_array_indentation) {
              // we REALLY need a newline here, but newliner would skip that
              opt.keep_array_indentation = false;
              print_newline();
              opt.keep_array_indentation = true;
            } else {
              print_newline();
            }
          }
        }

        restore_mode();
        print_token();
      }

      function handle_word() {
        if (current_token.type === 'TK_RESERVED' && flags.mode !== MODE.ObjectLiteral && in_array(current_token.text, ['set', 'get'])) {
          current_token.type = 'TK_WORD';
        }

        if (current_token.type === 'TK_RESERVED' && flags.mode === MODE.ObjectLiteral) {
          var next_token = get_token(1);

          if (next_token.text === ':') {
            current_token.type = 'TK_WORD';
          }
        }

        if (start_of_statement()) ; else if (current_token.wanted_newline && !is_expression(flags.mode) && (last_type !== 'TK_OPERATOR' || flags.last_text === '--' || flags.last_text === '++') && last_type !== 'TK_EQUALS' && (opt.preserve_newlines || !(last_type === 'TK_RESERVED' && in_array(flags.last_text, ['const', 'let', 'const', 'set', 'get'])))) {
          print_newline();
        }

        if (flags.do_block && !flags.do_while) {
          if (current_token.type === 'TK_RESERVED' && current_token.text === 'while') {
            // do {} ## while ()
            output.space_before_token = true;
            print_token();
            output.space_before_token = true;
            flags.do_while = true;
            return;
          } else {
            // do {} should always have while as the next word.
            // if we don't see the expected while, recover
            print_newline();
            flags.do_block = false;
          }
        } // if may be followed by else, or not
        // Bare/inline ifs are tricky
        // Need to unwind the modes correctly: if (a) if (b) c()  else d()  else e() 


        if (flags.if_block) {
          if (!flags.else_block && current_token.type === 'TK_RESERVED' && current_token.text === 'else') {
            flags.else_block = true;
          } else {
            while (flags.mode === MODE.Statement) {
              restore_mode();
            }

            flags.if_block = false;
            flags.else_block = false;
          }
        }

        if (current_token.type === 'TK_RESERVED' && (current_token.text === 'case' || current_token.text === 'default' && flags.in_case_statement)) {
          print_newline();

          if (flags.case_body || opt.jslint_happy) {
            // switch cases following one another
            deindent();
            flags.case_body = false;
          }

          print_token();
          flags.in_case = true;
          flags.in_case_statement = true;
          return;
        }

        if (current_token.type === 'TK_RESERVED' && current_token.text === 'function') {
          if (in_array(flags.last_text, ['}', ' ']) || output.just_added_newline() && !in_array(flags.last_text, ['[', '{', ':', '=', ','])) {
            // make sure there is a nice clean space of at least one blank line
            // before a new function definition
            if (!output.just_added_blankline() && !current_token.comments_before.length) {
              print_newline();
              print_newline(true);
            }
          }

          if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD') {
            if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['get', 'set', 'new', 'return', 'export', 'async'])) {
              output.space_before_token = true;
            } else if (last_type === 'TK_RESERVED' && flags.last_text === 'default' && last_last_text === 'export') {
              output.space_before_token = true;
            } else {
              print_newline();
            }
          } else if (last_type === 'TK_OPERATOR' || flags.last_text === '=') {
            // foo = function
            output.space_before_token = true;
          } else if (!flags.multiline_frame && (is_expression(flags.mode) || is_array(flags.mode))) ; else {
            print_newline();
          }
        }

        if (last_type === 'TK_COMMA' || last_type === 'TK_START_EXPR' || last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
          if (!start_of_object_property()) {
            allow_wrap_or_preserved_newline();
          }
        }

        if (current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['function', 'get', 'set'])) {
          print_token();
          flags.last_word = current_token.text;
          return;
        }

        prefix = 'NONE';

        if (last_type === 'TK_END_BLOCK') {
          if (!(current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['else', 'catch', 'finally']))) {
            prefix = 'NEWLINE';
          } else {
            if (opt.brace_style === 'expand' || opt.brace_style === 'end-expand' || opt.brace_style === 'none' && current_token.wanted_newline) {
              prefix = 'NEWLINE';
            } else {
              prefix = 'SPACE';
              output.space_before_token = true;
            }
          }
        } else if (last_type === 'TK_SEMICOLON' && flags.mode === MODE.BlockStatement) {
          // TODO: Should this be for STATEMENT as well?
          prefix = 'NEWLINE';
        } else if (last_type === 'TK_SEMICOLON' && is_expression(flags.mode)) {
          prefix = 'SPACE';
        } else if (last_type === 'TK_STRING') {
          prefix = 'NEWLINE';
        } else if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD' || flags.last_text === '*' && last_last_text === 'function') {
          prefix = 'SPACE';
        } else if (last_type === 'TK_START_BLOCK') {
          prefix = 'NEWLINE';
        } else if (last_type === 'TK_END_EXPR') {
          output.space_before_token = true;
          prefix = 'NEWLINE';
        }

        if (current_token.type === 'TK_RESERVED' && in_array(current_token.text, Tokenizer.line_starters) && flags.last_text !== ')') {
          if (flags.last_text === 'else' || flags.last_text === 'export') {
            prefix = 'SPACE';
          } else {
            prefix = 'NEWLINE';
          }
        }

        if (current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['else', 'catch', 'finally'])) {
          if (last_type !== 'TK_END_BLOCK' || opt.brace_style === 'expand' || opt.brace_style === 'end-expand' || opt.brace_style === 'none' && current_token.wanted_newline) {
            print_newline();
          } else {
            output.trim(true);
            var line = output.current_line; // If we trimmed and there's something other than a close block before us
            // put a newline back in.  Handles '} // comment' scenario.

            if (line.last() !== '}') {
              print_newline();
            }

            output.space_before_token = true;
          }
        } else if (prefix === 'NEWLINE') {
          if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
            // no newline between 'return nnn'
            output.space_before_token = true;
          } else if (last_type !== 'TK_END_EXPR') {
            if ((last_type !== 'TK_START_EXPR' || !(current_token.type === 'TK_RESERVED' && in_array(current_token.text, ['const', 'let', 'const']))) && flags.last_text !== ':') {
              // no need to force newline on 'const': for (const x = 0...)
              if (current_token.type === 'TK_RESERVED' && current_token.text === 'if' && flags.last_text === 'else') {
                // no newline for } else if {
                output.space_before_token = true;
              } else {
                print_newline();
              }
            }
          } else if (current_token.type === 'TK_RESERVED' && in_array(current_token.text, Tokenizer.line_starters) && flags.last_text !== ')') {
            print_newline();
          }
        } else if (flags.multiline_frame && is_array(flags.mode) && flags.last_text === ',' && last_last_text === '}') {
          print_newline(); // }, in lists get a newline treatment
        } else if (prefix === 'SPACE') {
          output.space_before_token = true;
        }

        print_token();
        flags.last_word = current_token.text;

        if (current_token.type === 'TK_RESERVED' && current_token.text === 'do') {
          flags.do_block = true;
        }

        if (current_token.type === 'TK_RESERVED' && current_token.text === 'if') {
          flags.if_block = true;
        }
      }

      function handle_semicolon() {
        if (start_of_statement()) {
          // The conditional starts the statement if appropriate.
          // Semicolon can be the start (and end) of a statement
          output.space_before_token = false;
        }

        while (flags.mode === MODE.Statement && !flags.if_block && !flags.do_block) {
          restore_mode();
        }

        print_token();
      }

      function handle_string() {
        if (start_of_statement()) {
          // The conditional starts the statement if appropriate.
          // One difference - strings want at least a space before
          output.space_before_token = true;
        } else if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD') {
          output.space_before_token = true;
        } else if (last_type === 'TK_COMMA' || last_type === 'TK_START_EXPR' || last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
          if (!start_of_object_property()) {
            allow_wrap_or_preserved_newline();
          }
        } else {
          print_newline();
        }

        print_token();
      }

      function handle_equals() {
        if (start_of_statement()) ;

        if (flags.declaration_statement) {
          // just got an '=' in a const-line, different formatting/line-breaking, etc will now be done
          flags.declaration_assignment = true;
        }

        output.space_before_token = true;
        print_token();
        output.space_before_token = true;
      }

      function handle_comma() {
        if (flags.declaration_statement) {
          if (is_expression(flags.parent.mode)) {
            // do not break on comma, for(const a = 1, b = 2)
            flags.declaration_assignment = false;
          }

          print_token();

          if (flags.declaration_assignment) {
            flags.declaration_assignment = false;
            print_newline(false, true);
          } else {
            output.space_before_token = true; // for comma-first, we want to allow a newline before the comma
            // to turn into a newline after the comma, which we will fixup later

            if (opt.comma_first) {
              allow_wrap_or_preserved_newline();
            }
          }

          return;
        }

        print_token();

        if (flags.mode === MODE.ObjectLiteral || flags.mode === MODE.Statement && flags.parent.mode === MODE.ObjectLiteral) {
          if (flags.mode === MODE.Statement) {
            restore_mode();
          }

          print_newline();
        } else {
          // EXPR or DO_BLOCK
          output.space_before_token = true; // for comma-first, we want to allow a newline before the comma
          // to turn into a newline after the comma, which we will fixup later

          if (opt.comma_first) {
            allow_wrap_or_preserved_newline();
          }
        }
      }

      function handle_operator() {
        if (start_of_statement()) ;

        if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
          // "return" had a special handling in TK_WORD. Now we need to return the favor
          output.space_before_token = true;
          print_token();
          return;
        } // hack for actionscript's import .* 


        if (current_token.text === '*' && last_type === 'TK_DOT') {
          print_token();
          return;
        }

        if (current_token.text === ':' && flags.in_case) {
          flags.case_body = true;
          indent();
          print_token();
          print_newline();
          flags.in_case = false;
          return;
        }

        if (current_token.text === '::') {
          // no spaces around exotic namespacing syntax operator
          print_token();
          return;
        } // Allow line wrapping between operators


        if (last_type === 'TK_OPERATOR') {
          allow_wrap_or_preserved_newline();
        }

        var space_before = true;
        var space_after = true;

        if (in_array(current_token.text, ['--', '++', '!', '~']) || in_array(current_token.text, ['-', '+']) && (in_array(last_type, ['TK_START_BLOCK', 'TK_START_EXPR', 'TK_EQUALS', 'TK_OPERATOR']) || in_array(flags.last_text, Tokenizer.line_starters) || flags.last_text === ',')) {
          // unary operators (and binary +/- pretending to be unary) special cases
          space_before = false;
          space_after = false; // http://www.ecma-international.org/ecma-262/5.1/#sec-7.9.1
          // if there is a newline between -- or ++ and anything else we should preserve it.

          if (current_token.wanted_newline && (current_token.text === '--' || current_token.text === '++')) {
            print_newline(false, true);
          }

          if (flags.last_text === ' ' && is_expression(flags.mode)) {
            // for (   ++i)
            //        ^^^
            space_before = true;
          }

          if (last_type === 'TK_RESERVED') {
            space_before = true;
          } else if (last_type === 'TK_END_EXPR') {
            space_before = !(flags.last_text === ']' && (current_token.text === '--' || current_token.text === '++'));
          } else if (last_type === 'TK_OPERATOR') {
            // a++ + ++b 
            // a - -b
            space_before = in_array(current_token.text, ['--', '-', '++', '+']) && in_array(flags.last_text, ['--', '-', '++', '+']); // + and - are not unary when preceeded by -- or ++ operator
            // a-- + b
            // a * +b
            // a - -b

            if (in_array(current_token.text, ['+', '-']) && in_array(flags.last_text, ['--', '++'])) {
              space_after = true;
            }
          }

          if ((flags.mode === MODE.BlockStatement || flags.mode === MODE.Statement) && (flags.last_text === '{' || flags.last_text === ' ')) {
            // { foo  --i }
            // foo()  --bar 
            print_newline();
          }
        } else if (current_token.text === ':') {
          if (flags.ternary_depth === 0) {
            // Colon is invalid javascript outside of ternary and object, but do our best to guess what was meant.
            space_before = false;
          } else {
            flags.ternary_depth -= 1;
          }
        } else if (current_token.text === '?') {
          flags.ternary_depth += 1;
        } else if (current_token.text === '*' && last_type === 'TK_RESERVED' && flags.last_text === 'function') {
          space_before = false;
          space_after = false;
        }

        output.space_before_token = output.space_before_token || space_before;
        print_token();
        output.space_before_token = space_after;
      }

      function handle_block_comment() {
        if (output.raw) {
          output.add_raw_token(current_token);

          if (current_token.directives && current_token.directives['preserve'] === 'end') {
            // If we're testing the raw output behavior, do not allow a directive to turn it off.
            if (!opt.test_output_raw) {
              output.raw = false;
            }
          }

          return;
        }

        if (current_token.directives) {
          print_newline(false, true);
          print_token();

          if (current_token.directives['preserve'] === 'start') {
            output.raw = true;
          }

          print_newline(false, true);
          return;
        } // inline block


        if (!acorn.newline.test(current_token.text) && !current_token.wanted_newline) {
          output.space_before_token = true;
          print_token();
          output.space_before_token = true;
          return;
        }

        var lines = split_newlines(current_token.text);
        var j; // iterator for this case

        var javadoc = false;
        var starless = false;
        var lastIndent = current_token.whitespace_before;
        var lastIndentLength = lastIndent.length; // block comment starts with a new line

        print_newline(false, true);

        if (lines.length > 1) {
          if (all_lines_start_with(lines.slice(1), '*')) {
            javadoc = true;
          } else if (each_line_matches_indent(lines.slice(1), lastIndent)) {
            starless = true;
          }
        } // first line always indented


        print_token(lines[0]);

        for (j = 1; j < lines.length; j++) {
          print_newline(false, true);

          if (javadoc) {
            // javadoc: reformat and re-indent
            print_token(' ' + ltrim(lines[j]));
          } else if (starless && lines[j].length > lastIndentLength) {
            // starless: re-indent non-empty content, avoiding trim
            print_token(lines[j].substring(lastIndentLength));
          } else {
            // normal comments output raw
            output.add_token(lines[j]);
          }
        } // for comments of more than one line, make sure there's a new line after


        print_newline(false, true);
      }

      function handle_comment() {
        if (current_token.wanted_newline) {
          print_newline(false, true);
        } else {
          output.trim(true);
        }

        output.space_before_token = true;
        print_token();
        print_newline(false, true);
      }

      function handle_dot() {
        if (start_of_statement()) ;

        if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
          output.space_before_token = true;
        } else {
          // allow preserved newlines before dots in general
          // force newlines on dots after close paren when break_chained - for bar().baz()
          allow_wrap_or_preserved_newline(flags.last_text === ')' && opt.break_chained_methods);
        }

        print_token();
      }

      function handle_unknown() {
        print_token();

        if (current_token.text[current_token.text.length - 1] === '\n') {
          print_newline();
        }
      }

      function handle_eof() {
        // Unwind any open statements
        while (flags.mode === MODE.Statement) {
          restore_mode();
        }
      }
    }

    function OutputLine(parent) {
      var _character_count = 0; // use indent_count as a marker for lines that have preserved indentation

      var _indent_count = -1;

      var _items = [];
      var _empty = true;

      this.set_indent = function (level) {
        _character_count = parent.baseIndentLength + level * parent.indent_length;
        _indent_count = level;
      };

      this.get_character_count = function () {
        return _character_count;
      };

      this.is_empty = function () {
        return _empty;
      };

      this.last = function () {
        if (!this._empty) {
          return _items[_items.length - 1];
        } else {
          return null;
        }
      };

      this.push = function (input) {
        _items.push(input);

        _character_count += input.length;
        _empty = false;
      };

      this.pop = function () {
        var item = null;

        if (!_empty) {
          item = _items.pop();
          _character_count -= item.length;
          _empty = _items.length === 0;
        }

        return item;
      };

      this.remove_indent = function () {
        if (_indent_count > 0) {
          _indent_count -= 1;
          _character_count -= parent.indent_length;
        }
      };

      this.trim = function () {
        while (this.last() === ' ') {
          _items.pop();

          _character_count -= 1;
        }

        _empty = _items.length === 0;
      };

      this.toString = function () {
        var result = '';

        if (!this._empty) {
          if (_indent_count >= 0) {
            result = parent.indent_cache[_indent_count];
          }

          result += _items.join('');
        }

        return result;
      };
    }

    function Output(indent_string, baseIndentString) {
      baseIndentString = baseIndentString || '';
      this.indent_cache = [baseIndentString];
      this.baseIndentLength = baseIndentString.length;
      this.indent_length = indent_string.length;
      this.raw = false;
      var lines = [];
      this.baseIndentString = baseIndentString;
      this.indent_string = indent_string;
      this.previous_line = null;
      this.current_line = null;
      this.space_before_token = false;

      this.add_outputline = function () {
        this.previous_line = this.current_line;
        this.current_line = new OutputLine(this);
        lines.push(this.current_line);
      }; // initialize


      this.add_outputline();

      this.get_line_number = function () {
        return lines.length;
      }; // Using object instead of string to allow for later expansion of info about each line


      this.add_new_line = function (force_newline) {
        if (this.get_line_number() === 1 && this.just_added_newline()) {
          return false; // no newline on start of file
        }

        if (force_newline || !this.just_added_newline()) {
          if (!this.raw) {
            this.add_outputline();
          }

          return true;
        }

        return false;
      };

      this.get_code = function () {
        var sweet_code = lines.join('\n').replace(/[\r\n\t ]+$/, '');
        return sweet_code;
      };

      this.set_indent = function (level) {
        // Never indent your first output indent at the start of the file
        if (lines.length > 1) {
          while (level >= this.indent_cache.length) {
            this.indent_cache.push(this.indent_cache[this.indent_cache.length - 1] + this.indent_string);
          }

          this.current_line.set_indent(level);
          return true;
        }

        this.current_line.set_indent(0);
        return false;
      };

      this.add_raw_token = function (token) {
        for (var x = 0; x < token.newlines; x++) {
          this.add_outputline();
        }

        this.current_line.push(token.whitespace_before);
        this.current_line.push(token.text);
        this.space_before_token = false;
      };

      this.add_token = function (printable_token) {
        this.add_space_before_token();
        this.current_line.push(printable_token);
      };

      this.add_space_before_token = function () {
        if (this.space_before_token && !this.just_added_newline()) {
          this.current_line.push(' ');
        }

        this.space_before_token = false;
      };

      this.remove_redundant_indentation = function (frame) {
        // This implementation is effective but has some issues:
        //     - can cause line wrap to happen too soon due to indent removal
        //           after wrap points are calculated
        // These issues are minor compared to ugly indentation.
        if (frame.multiline_frame || frame.mode === MODE.ForInitializer || frame.mode === MODE.Conditional) {
          return;
        } // remove one indent from each line inside this section


        var index = frame.start_line_index;
        var output_length = lines.length;

        while (index < output_length) {
          lines[index].remove_indent();
          index++;
        }
      };

      this.trim = function (eat_newlines) {
        eat_newlines = eat_newlines === undefined ? false : eat_newlines;
        this.current_line.trim(indent_string, baseIndentString);

        while (eat_newlines && lines.length > 1 && this.current_line.is_empty()) {
          lines.pop();
          this.current_line = lines[lines.length - 1];
          this.current_line.trim();
        }

        this.previous_line = lines.length > 1 ? lines[lines.length - 2] : null;
      };

      this.just_added_newline = function () {
        return this.current_line.is_empty();
      };

      this.just_added_blankline = function () {
        if (this.just_added_newline()) {
          if (lines.length === 1) {
            return true; // start of the file and newline = blank
          }

          var line = lines[lines.length - 2];
          return line.is_empty();
        }

        return false;
      };
    }

    var Token = function Token(type, text, newlines, whitespace_before, mode, parent) {
      this.type = type;
      this.text = text;
      this.comments_before = [];
      this.newlines = newlines || 0;
      this.wanted_newline = newlines > 0;
      this.whitespace_before = whitespace_before || '';
      this.parent = null;
      this.directives = null;
    };

    function tokenizer(input, opts, indent_string) {
      var whitespace = '\n\r\t '.split('');
      var digit = /[0-9]/;
      var digit_oct = /[01234567]/;
      var digit_hex = /[0123456789abcdefABCDEF]/;
      var punct = '+ - * / % & ++ -- = += -= *= /= %= == === != !== > < >= <= >> << >>> >>>= >>= <<= && &= | || ! ~ , : ? ^ ^= |= :: =>'.split(' '); // words which should always start on new line.

      this.line_starters = 'continue,try,throw,return,const,let,const,if,switch,case,default,for,while,break,function,import,export'.split(',');
      var reserved_words = this.line_starters.concat(['do', 'in', 'else', 'get', 'set', 'new', 'catch', 'finally', 'typeof', 'yield', 'async', 'await']); //  /* ... */ comment ends with nearest */ or end of file

      var block_comment_pattern = /([\s\S]*?)((?:\*\/)|$)/g; // comment ends just before nearest linefeed or end of file

      var comment_pattern = /([^\n\r\u2028\u2029]*)/g;
      var directives_block_pattern = /\/\* beautify( \w+[:]\w+)+ \*\//g;
      var directive_pattern = / (\w+)[:](\w+)/g;
      var directives_end_ignore_pattern = /([\s\S]*?)((?:\/\*\sbeautify\signore:end\s\*\/)|$)/g;
      var template_pattern = /((<\?php|<\?=)[\s\S]*?\?>)|(<%[\s\S]*?%>)/g;
      var n_newlines, whitespace_before_token, in_html_comment, tokens, parser_pos;
      var input_length;

      this.tokenize = function () {
        // cache the source's length.
        input_length = input.length;
        parser_pos = 0;
        in_html_comment = false;
        tokens = [];
        var next, last;
        var token_values;
        var open = null;
        var open_stack = [];
        var comments = [];

        while (!(last && last.type === 'TK_EOF')) {
          token_values = tokenize_next();
          next = new Token(token_values[1], token_values[0], n_newlines, whitespace_before_token);

          while (next.type === 'TK_COMMENT' || next.type === 'TK_BLOCK_COMMENT' || next.type === 'TK_UNKNOWN') {
            if (next.type === 'TK_BLOCK_COMMENT') {
              next.directives = token_values[2];
            }

            comments.push(next);
            token_values = tokenize_next();
            next = new Token(token_values[1], token_values[0], n_newlines, whitespace_before_token);
          }

          if (comments.length) {
            next.comments_before = comments;
            comments = [];
          }

          if (next.type === 'TK_START_BLOCK' || next.type === 'TK_START_EXPR') {
            next.parent = last;
            open_stack.push(open);
            open = next;
          } else if ((next.type === 'TK_END_BLOCK' || next.type === 'TK_END_EXPR') && open && (next.text === ']' && open.text === '[' || next.text === ')' && open.text === '(' || next.text === '}' && open.text === '{')) {
            next.parent = open.parent;
            open = open_stack.pop();
          }

          tokens.push(next);
          last = next;
        }

        return tokens;
      };

      function get_directives(text) {
        if (!text.match(directives_block_pattern)) {
          return null;
        }

        var directives = {};
        directive_pattern.lastIndex = 0;
        var directive_match = directive_pattern.exec(text);

        while (directive_match) {
          directives[directive_match[1]] = directive_match[2];
          directive_match = directive_pattern.exec(text);
        }

        return directives;
      }

      function tokenize_next() {
        var resulting_string;
        var whitespace_on_this_line = [];
        n_newlines = 0;
        whitespace_before_token = '';

        if (parser_pos >= input_length) {
          return ['', 'TK_EOF'];
        }

        var last_token;

        if (tokens.length) {
          last_token = tokens[tokens.length - 1];
        } else {
          // For the sake of tokenizing we can pretend that there was on open brace to start
          last_token = new Token('TK_START_BLOCK', '{');
        }

        var c = input.charAt(parser_pos);
        parser_pos += 1;

        while (in_array(c, whitespace)) {
          if (acorn.newline.test(c)) {
            if (!(c === '\n' && input.charAt(parser_pos - 2) === '\r')) {
              n_newlines += 1;
              whitespace_on_this_line = [];
            }
          } else {
            whitespace_on_this_line.push(c);
          }

          if (parser_pos >= input_length) {
            return ['', 'TK_EOF'];
          }

          c = input.charAt(parser_pos);
          parser_pos += 1;
        }

        if (whitespace_on_this_line.length) {
          whitespace_before_token = whitespace_on_this_line.join('');
        }

        if (digit.test(c)) {
          var allow_decimal = true;
          var allow_e = true;
          var local_digit = digit;

          if (c === '0' && parser_pos < input_length && /[Xxo]/.test(input.charAt(parser_pos))) {
            // switch to hex/oct number, no decimal or e, just hex/oct digits
            allow_decimal = false;
            allow_e = false;
            c += input.charAt(parser_pos);
            parser_pos += 1;
            local_digit = /[o]/.test(input.charAt(parser_pos)) ? digit_oct : digit_hex;
          } else {
            // we know this first loop will run.  It keeps the logic simpler.
            c = '';
            parser_pos -= 1;
          } // Add the digits


          while (parser_pos < input_length && local_digit.test(input.charAt(parser_pos))) {
            c += input.charAt(parser_pos);
            parser_pos += 1;

            if (allow_decimal && parser_pos < input_length && input.charAt(parser_pos) === '.') {
              c += input.charAt(parser_pos);
              parser_pos += 1;
              allow_decimal = false;
            }

            if (allow_e && parser_pos < input_length && /[Ee]/.test(input.charAt(parser_pos))) {
              c += input.charAt(parser_pos);
              parser_pos += 1;

              if (parser_pos < input_length && /[+-]/.test(input.charAt(parser_pos))) {
                c += input.charAt(parser_pos);
                parser_pos += 1;
              }

              allow_e = false;
              allow_decimal = false;
            }
          }

          return [c, 'TK_WORD'];
        }

        if (acorn.isIdentifierStart(input.charCodeAt(parser_pos - 1))) {
          if (parser_pos < input_length) {
            while (acorn.isIdentifierChar(input.charCodeAt(parser_pos))) {
              c += input.charAt(parser_pos);
              parser_pos += 1;

              if (parser_pos === input_length) {
                break;
              }
            }
          }

          if (!(last_token.type === 'TK_DOT' || last_token.type === 'TK_RESERVED' && in_array(last_token.text, ['set', 'get'])) && in_array(c, reserved_words)) {
            if (c === 'in') {
              // hack for 'in' operator
              return [c, 'TK_OPERATOR'];
            }

            return [c, 'TK_RESERVED'];
          }

          return [c, 'TK_WORD'];
        }

        if (c === '(' || c === '[') {
          return [c, 'TK_START_EXPR'];
        }

        if (c === ')' || c === ']') {
          return [c, 'TK_END_EXPR'];
        }

        if (c === '{') {
          return [c, 'TK_START_BLOCK'];
        }

        if (c === '}') {
          return [c, 'TK_END_BLOCK'];
        }

        if (c === ' ') {
          return [c, 'TK_SEMICOLON'];
        }

        if (c === '/') {
          var comment = ''; // peek for comment /* ... */

          if (input.charAt(parser_pos) === '*') {
            parser_pos += 1;
            block_comment_pattern.lastIndex = parser_pos;
            var comment_match = block_comment_pattern.exec(input);
            comment = '/*' + comment_match[0];
            parser_pos += comment_match[0].length;
            var directives = get_directives(comment);

            if (directives && directives['ignore'] === 'start') {
              directives_end_ignore_pattern.lastIndex = parser_pos;
              comment_match = directives_end_ignore_pattern.exec(input);
              comment += comment_match[0];
              parser_pos += comment_match[0].length;
            }

            comment = comment.replace(acorn.lineBreak, '\n');
            return [comment, 'TK_BLOCK_COMMENT', directives];
          } // peek for comment // ...


          if (input.charAt(parser_pos) === '/') {
            parser_pos += 1;
            comment_pattern.lastIndex = parser_pos;

            var _comment_match = comment_pattern.exec(input);

            comment = '//' + _comment_match[0];
            parser_pos += _comment_match[0].length;
            return [comment, 'TK_COMMENT'];
          }
        }

        if (c === '`' || c === '\'' || c === '"' || // string
        (c === '/' || // regexp
        opts.e4x && c === '<' && input.slice(parser_pos - 1).match(/^<([-a-zA-Z:0-9_.]+|{[^{}]*}|!\[CDATA\[[\s\S]*?\]\])(\s+[-a-zA-Z:0-9_.]+\s*=\s*('[^']*'|"[^"]*"|{.*?}))*\s*(\/?)\s*>/) // xml
        ) && ( // regex and xml can only appear in specific locations during parsing
        last_token.type === 'TK_RESERVED' && in_array(last_token.text, ['return', 'case', 'throw', 'else', 'do', 'typeof', 'yield']) || last_token.type === 'TK_END_EXPR' && last_token.text === ')' && last_token.parent && last_token.parent.type === 'TK_RESERVED' && in_array(last_token.parent.text, ['if', 'while', 'for']) || in_array(last_token.type, ['TK_COMMENT', 'TK_START_EXPR', 'TK_START_BLOCK', 'TK_END_BLOCK', 'TK_OPERATOR', 'TK_EQUALS', 'TK_EOF', 'TK_SEMICOLON', 'TK_COMMA']))) {
          var sep = c,
              esc = false,
              has_char_escapes = false;
          resulting_string = c;

          if (sep === '/') {
            //
            // handle regexp
            //
            var in_char_class = false;

            while (parser_pos < input_length && (esc || in_char_class || input.charAt(parser_pos) !== sep) && !acorn.newline.test(input.charAt(parser_pos))) {
              resulting_string += input.charAt(parser_pos);

              if (!esc) {
                esc = input.charAt(parser_pos) === '\\';

                if (input.charAt(parser_pos) === '[') {
                  in_char_class = true;
                } else if (input.charAt(parser_pos) === ']') {
                  in_char_class = false;
                }
              } else {
                esc = false;
              }

              parser_pos += 1;
            }
          } else if (opts.e4x && sep === '<') {
            //
            // handle e4x xml literals
            //
            var xmlRegExp = /<(\/?)([-a-zA-Z:0-9_.]+|{[^{}]*}|!\[CDATA\[[\s\S]*?\]\])(\s+[-a-zA-Z:0-9_.]+\s*=\s*('[^']*'|"[^"]*"|{.*?}))*\s*(\/?)\s*>/g;
            var xmlStr = input.slice(parser_pos - 1);
            var match = xmlRegExp.exec(xmlStr);

            if (match && match.index === 0) {
              var rootTag = match[2];
              var depth = 0;

              while (match) {
                var isEndTag = !!match[1];
                var tagName = match[2];
                var isSingletonTag = !!match[match.length - 1] || tagName.slice(0, 8) === '![CDATA[';

                if (tagName === rootTag && !isSingletonTag) {
                  if (isEndTag) {
                    --depth;
                  } else {
                    ++depth;
                  }
                }

                if (depth <= 0) {
                  break;
                }

                match = xmlRegExp.exec(xmlStr);
              }

              var xmlLength = match ? match.index + match[0].length : xmlStr.length;
              xmlStr = xmlStr.slice(0, xmlLength);
              parser_pos += xmlLength - 1;
              xmlStr = xmlStr.replace(acorn.lineBreak, '\n');
              return [xmlStr, 'TK_STRING'];
            }
          } else {
            //
            // handle string
            //
            // Template strings can travers lines without escape characters.
            // Other strings cannot
            while (parser_pos < input_length && (esc || input.charAt(parser_pos) !== sep && (sep === '`' || !acorn.newline.test(input.charAt(parser_pos))))) {
              // Handle \r\n linebreaks after escapes or in template strings
              if ((esc || sep === '`') && acorn.newline.test(input.charAt(parser_pos))) {
                if (input.charAt(parser_pos) === '\r' && input.charAt(parser_pos + 1) === '\n') {
                  parser_pos += 1;
                }

                resulting_string += '\n';
              } else {
                resulting_string += input.charAt(parser_pos);
              }

              if (esc) {
                if (input.charAt(parser_pos) === 'x' || input.charAt(parser_pos) === 'u') {
                  has_char_escapes = true;
                }

                esc = false;
              } else {
                esc = input.charAt(parser_pos) === '\\';
              }

              parser_pos += 1;
            }
          }

          if (has_char_escapes && opts.unescape_strings) {
            resulting_string = unescape_string(resulting_string);
          }

          if (parser_pos < input_length && input.charAt(parser_pos) === sep) {
            resulting_string += sep;
            parser_pos += 1;

            if (sep === '/') {
              // regexps may have modifiers /regexp/MOD , so fetch those, too
              // Only [gim] are valid, but if the user puts in garbage, do what we can to take it.
              while (parser_pos < input_length && acorn.isIdentifierStart(input.charCodeAt(parser_pos))) {
                resulting_string += input.charAt(parser_pos);
                parser_pos += 1;
              }
            }
          }

          return [resulting_string, 'TK_STRING'];
        }

        if (c === '#') {
          if (tokens.length === 0 && input.charAt(parser_pos) === '!') {
            // shebang
            resulting_string = c;

            while (parser_pos < input_length && c !== '\n') {
              c = input.charAt(parser_pos);
              resulting_string += c;
              parser_pos += 1;
            }

            return [trim(resulting_string) + '\n', 'TK_UNKNOWN'];
          } // Spidermonkey-specific sharp variables for circular references
          // https://developer.mozilla.org/En/Sharp_variables_in_JavaScript
          // http://mxr.mozilla.org/mozilla-central/source/js/src/jsscan.cpp around line 1935


          var sharp = '#';

          if (parser_pos < input_length && digit.test(input.charAt(parser_pos))) {
            do {
              c = input.charAt(parser_pos);
              sharp += c;
              parser_pos += 1;
            } while (parser_pos < input_length && c !== '#' && c !== '=');

            if (c === '#') ; else if (input.charAt(parser_pos) === '[' && input.charAt(parser_pos + 1) === ']') {
              sharp += '[]';
              parser_pos += 2;
            } else if (input.charAt(parser_pos) === '{' && input.charAt(parser_pos + 1) === '}') {
              sharp += '{}';
              parser_pos += 2;
            }

            return [sharp, 'TK_WORD'];
          }
        }

        if (c === '<' && (input.charAt(parser_pos) === '?' || input.charAt(parser_pos) === '%')) {
          template_pattern.lastIndex = parser_pos - 1;
          var template_match = template_pattern.exec(input);

          if (template_match) {
            c = template_match[0];
            parser_pos += c.length - 1;
            c = c.replace(acorn.lineBreak, '\n');
            return [c, 'TK_STRING'];
          }
        }

        if (c === '<' && input.substring(parser_pos - 1, parser_pos + 3) === '<!--') {
          parser_pos += 3;
          c = '<!--';

          while (!acorn.newline.test(input.charAt(parser_pos)) && parser_pos < input_length) {
            c += input.charAt(parser_pos);
            parser_pos++;
          }

          in_html_comment = true;
          return [c, 'TK_COMMENT'];
        }

        if (c === '-' && in_html_comment && input.substring(parser_pos - 1, parser_pos + 2) === '-->') {
          in_html_comment = false;
          parser_pos += 2;
          return ['-->', 'TK_COMMENT'];
        }

        if (c === '.') {
          return [c, 'TK_DOT'];
        }

        if (in_array(c, punct)) {
          while (parser_pos < input_length && in_array(c + input.charAt(parser_pos), punct)) {
            c += input.charAt(parser_pos);
            parser_pos += 1;

            if (parser_pos >= input_length) {
              break;
            }
          }

          if (c === ',') {
            return [c, 'TK_COMMA'];
          } else if (c === '=') {
            return [c, 'TK_EQUALS'];
          } else {
            return [c, 'TK_OPERATOR'];
          }
        }

        return [c, 'TK_UNKNOWN'];
      }

      function unescape_string(s) {
        var esc = false,
            out = '',
            pos = 0,
            s_hex = '',
            escaped = 0,
            c;

        while (esc || pos < s.length) {
          c = s.charAt(pos);
          pos++;

          if (esc) {
            esc = false;

            if (c === 'x') {
              // simple hex-escape \x24
              s_hex = s.substr(pos, 2);
              pos += 2;
            } else if (c === 'u') {
              // unicode-escape, \u2134
              s_hex = s.substr(pos, 4);
              pos += 4;
            } else {
              // some common escape, e.g \n
              out += '\\' + c;
              continue;
            }

            if (!s_hex.match(/^[0123456789abcdefABCDEF]+$/)) {
              // some weird escaping, bail out,
              // leaving whole string intact
              return s;
            }

            escaped = parseInt(s_hex, 16);

            if (escaped >= 0x00 && escaped < 0x20) {
              // leave 0x00...0x1f escaped
              if (c === 'x') {
                out += '\\x' + s_hex;
              } else {
                out += "\\u" + s_hex;
              }

              continue;
            } else if (escaped === 0x22 || escaped === 0x27 || escaped === 0x5c) {
              // single-quote, apostrophe, backslash - escape these
              out += '\\' + String.fromCharCode(escaped);
            } else if (c === 'x' && escaped > 0x7e && escaped <= 0xff) {
              // we bail out on \x7f..\xff,
              // leaving whole string escaped,
              // as it's probably completely binary
              return s;
            } else {
              out += String.fromCharCode(escaped);
            }
          } else if (c === '\\') {
            esc = true;
          } else {
            out += c;
          }
        }

        return out;
      }
    }

    return {
      run: run
      /* jshint ignore:end */

      /* jscs:enable */

    };
  };

  Object.assign(FE.DEFAULTS, {
    codeMirror: window.CodeMirror,
    codeMirrorOptions: {
      lineNumbers: true,
      tabMode: 'indent',
      indentWithTabs: true,
      lineWrapping: true,
      mode: 'text/html',
      tabSize: 2
    },
    codeBeautifierOptions: {
      end_with_newline: true,
      indent_inner_html: true,
      extra_liners: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'ul', 'ol', 'table', 'dl'],
      brace_style: 'expand',
      indent_char: '\t',
      indent_size: 1,
      wrap_line_length: 0
    },
    codeViewKeepActiveButtons: ['fullscreen']
  });

  FE.PLUGINS.codeView = function (editor) {
    var $ = editor.$;
    var $html_area;
    var code_mirror;
    /**
     * Check if code view is enabled.
     */

    function isActive() {
      return editor.$box.hasClass('fr-code-view');
    }

    function get() {
      if (code_mirror) {
        return code_mirror.getValue();
      } else {
        return $html_area.val();
      }
    }

    function refresh() {
      if (isActive()) {
        if (code_mirror) {
          code_mirror.setSize(null, editor.opts.height ? editor.opts.height : 'auto');
        }

        if (editor.opts.heightMin || editor.opts.height) {
          editor.$box.find('.CodeMirror-scroll, .CodeMirror-gutters').css('min-height', editor.opts.heightMin || editor.opts.height);
          $html_area.css('height', editor.opts.height);
        } else {
          editor.$box.find('.CodeMirror-scroll, .CodeMirror-gutters').css('min-height', '');
        }
      }
    }
    /**
     * Get back to edit mode.
     */


    function _showText($btn) {
      var html = get(); // Code mirror enabled.

      editor.html.set(html); // Blur the element.

      editor.$el.blur(); // Toolbar no longer disabled.

      editor.$tb.find('.fr-btn-grp > .fr-command, .fr-more-toolbar > .fr-command, .fr-btn-grp > .fr-btn-wrap > .fr-command, .fr-more-toolbar > .fr-btn-wrap > .fr-command').not($btn).removeClass('fr-disabled').attr('aria-disabled', false);
      $btn.removeClass('fr-active').attr('aria-pressed', false);
      editor.selection.setAtStart(editor.el);
      editor.selection.restore();
      editor.placeholder.refresh();
      editor.undo.saveStep();
    }

    var _can_focus = false;

    function _blur() {
      if (isActive()) {
        editor.events.trigger('blur');
      }
    }

    function _focus() {
      if (isActive() && _can_focus) {
        editor.events.trigger('focus');
      }
    }
    /**
     * Get to code mode.
     */


    function _showHTML($btn) {
      if (!$html_area) {
        _initArea(); // Enable code mirror.


        if (!code_mirror && editor.opts.codeMirror) {
          code_mirror = editor.opts.codeMirror.fromTextArea($html_area.get(0), editor.opts.codeMirrorOptions);
          code_mirror.on('blur', _blur);
          code_mirror.on('focus', _focus);
        } else {
          editor.events.$on($html_area, 'keydown keyup change input', function () {
            if (!editor.opts.height) {
              this.rows = 1; // Textarea has no content anymore.

              if (this.value.length === 0) {
                this.style.height = 'auto';
              } else {
                this.style.height = this.scrollHeight + 'px';
              }
            } else {
              this.removeAttribute('rows');
            }
          });
          editor.events.$on($html_area, 'blur', _blur);
          editor.events.$on($html_area, 'focus', _focus);
        }
      }

      editor.undo.saveStep(); // Clean white tags but ignore selection.

      editor.html.cleanEmptyTags();
      editor.html.cleanWhiteTags(true); // Blur the element.

      if (editor.core.hasFocus()) {
        if (!editor.core.isEmpty()) {
          editor.selection.save();
          editor.$el.find('.fr-marker[data-type="true"]').first().replaceWith('<span class="fr-tmp fr-sm">F</span>');
          editor.$el.find('.fr-marker[data-type="false"]').last().replaceWith('<span class="fr-tmp fr-em">F</span>');
        }
      } // Get HTML.


      var html = editor.html.get(false, true);
      editor.$el.find('span.fr-tmp').remove();
      editor.$box.toggleClass('fr-code-view', true);
      var was_focused = false;

      if (editor.core.hasFocus()) {
        was_focused = true;
        editor.events.disableBlur();
        editor.$el.blur();
      }

      html = html.replace(/<span class="fr-tmp fr-sm">F<\/span>/, 'FROALA-SM');
      html = html.replace(/<span class="fr-tmp fr-em">F<\/span>/, 'FROALA-EM'); // Beautify HTML.

      if (editor.codeBeautifier && !html.includes('fr-embedly')) {
        html = editor.codeBeautifier.run(html, editor.opts.codeBeautifierOptions);
      }

      var s_index;
      var e_index; // Code mirror is enabled.

      if (code_mirror) {
        s_index = html.indexOf('FROALA-SM');
        e_index = html.indexOf('FROALA-EM');

        if (s_index > e_index) {
          s_index = e_index;
        } else {
          e_index = e_index - 9;
        }

        html = html.replace(/FROALA-SM/g, '').replace(/FROALA-EM/g, '');
        var s_line = html.substring(0, s_index).length - html.substring(0, s_index).replace(/\n/g, '').length;
        var e_line = html.substring(0, e_index).length - html.substring(0, e_index).replace(/\n/g, '').length;
        s_index = html.substring(0, s_index).length - html.substring(0, html.substring(0, s_index).lastIndexOf('\n') + 1).length;
        e_index = html.substring(0, e_index).length - html.substring(0, html.substring(0, e_index).lastIndexOf('\n') + 1).length;
        code_mirror.setSize(null, editor.opts.height ? editor.opts.height : 'auto');
        if (editor.opts.heightMin) editor.$box.find('.CodeMirror-scroll').css('min-height', editor.opts.heightMin);
        code_mirror.setValue(html);
        _can_focus = !was_focused;
        code_mirror.focus();
        _can_focus = true;
        code_mirror.setSelection({
          line: s_line,
          ch: s_index
        }, {
          line: e_line,
          ch: e_index
        });
        code_mirror.refresh();
        code_mirror.clearHistory();
      } // No code mirror.
      else {
          s_index = html.indexOf('FROALA-SM');
          e_index = html.indexOf('FROALA-EM') - 9;

          if (editor.opts.heightMin) {
            $html_area.css('min-height', editor.opts.heightMin);
          }

          if (editor.opts.height) {
            $html_area.css('height', editor.opts.height);
          }

          if (editor.opts.heightMax) {
            $html_area.css('max-height', editor.opts.height || editor.opts.heightMax);
          }

          $html_area.val(html.replace(/FROALA-SM/g, '').replace(/FROALA-EM/g, '')).trigger('change');
          var scroll_top = $(editor.o_doc).scrollTop();
          _can_focus = !was_focused;
          $html_area.focus();
          _can_focus = true;
          $html_area.get(0).setSelectionRange(s_index, e_index);
          $(editor.o_doc).scrollTop(scroll_top);
        } // Disable buttons.


      editor.$tb.find('.fr-btn-grp > .fr-command, .fr-more-toolbar > .fr-command, .fr-btn-grp > .fr-btn-wrap > .fr-command, .fr-more-toolbar > .fr-btn-wrap > .fr-command').not($btn).filter(function () {
        return editor.opts.codeViewKeepActiveButtons.indexOf($(this).data('cmd')) < 0;
      }).addClass('fr-disabled').attr('aria-disabled', true);
      $btn.addClass('fr-active').attr('aria-pressed', true);

      if (!editor.helpers.isMobile() && editor.opts.toolbarInline) {
        editor.toolbar.hide();
      }
    }
    /**
     * Toggle the code view.
     */


    function toggle(val) {
      if (typeof val == 'undefined') val = !isActive();
      var $btn = editor.$tb.find('.fr-command[data-cmd="html"]');

      if (!val) {
        editor.$box.toggleClass('fr-code-view', false);

        _showText($btn);
      } else {
        editor.popups.hideAll();

        _showHTML($btn);
      }
    }
    /**
     * Destroy.
     */


    function _destroy() {
      if (isActive()) {
        toggle(false);
      }

      if (code_mirror) code_mirror.toTextArea();
      $html_area.val('').removeData().remove();
      $html_area = null;

      if ($back_button) {
        $back_button.remove();
        $back_button = null;
      }
    }

    function _refreshToolbar() {
      var $btn = editor.$tb.find('.fr-command[data-cmd="html"]');

      if (!isActive()) {
        editor.$tb.find('.fr-btn-grp > .fr-command, .fr-more-toolbar > .fr-command').not($btn).removeClass('fr-disabled').attr('aria-disabled', false);
        $btn.removeClass('fr-active').attr('aria-pressed', false);
      } else {
        editor.$tb.find('.fr-btn-grp > .fr-command, .fr-more-toolbar > .fr-command').not($btn).filter(function () {
          return editor.opts.codeViewKeepActiveButtons.indexOf($(this).data('cmd')) < 0;
        }).addClass('fr-disabled').attr('aria-disabled', false);
        $btn.addClass('fr-active').attr('aria-pressed', false);
      }
    }

    function _initArea() {
      // Add the coding textarea to the wrapper.
      $html_area = $('<textarea class="fr-code" tabIndex="-1">');
      editor.$wp.append($html_area);
      $html_area.attr('dir', editor.opts.direction); // Exit code view button for inline toolbar.

      if (!editor.$box.hasClass('fr-basic')) {
        $back_button = $('<a data-cmd="html" title="Code View" class="fr-command fr-btn html-switch' + (editor.helpers.isMobile() ? '' : ' fr-desktop') + '" role="button" tabIndex="-1"><i class="fa fa-code"></i></button>');
        editor.$box.append($back_button);
        editor.events.bindClick(editor.$box, 'a.html-switch', function () {
          editor.events.trigger('commands.before', ['html']);
          toggle(false);
          editor.events.trigger('commands.after', ['html']);
        });
      }

      var cancel = function cancel() {
        return !isActive();
      }; // Disable refresh of the buttons while enabled.


      editor.events.on('buttons.refresh', cancel);
      editor.events.on('copy', cancel, true);
      editor.events.on('cut', cancel, true);
      editor.events.on('paste', cancel, true);
      editor.events.on('destroy', _destroy, true);
      editor.events.on('html.set', function () {
        if (isActive()) toggle(true);
      });
      editor.events.on('codeView.update', refresh);
      editor.events.on('codeView.toggle', function () {
        if (editor.$box.hasClass('fr-code-view')) {
          toggle();
        }
      });
      editor.events.on('form.submit', function () {
        if (isActive()) {
          // Code mirror enabled.
          editor.html.set(get());
          editor.events.trigger('contentChanged', [], true);
        }
      }, true);
    }
    /**
     * Initialize.
     */


    var $back_button;

    function _init() {
      // https://github.com/froala-labs/froala-editor-js-2/issues/672
      editor.events.on('focus', function () {
        if (editor.opts.toolbarContainer) {
          _refreshToolbar();
        }
      });
      if (!editor.$wp) return false;
    }

    return {
      _init: _init,
      toggle: toggle,
      isActive: isActive,
      get: get
    };
  };

  FE.RegisterCommand('html', {
    title: 'Code View',
    undo: false,
    focus: false,
    forcedRefresh: true,
    toggle: true,
    callback: function callback() {
      this.codeView.toggle();
    },
    plugin: 'codeView'
  });
  FE.DefineIcon('html', {
    NAME: 'code',
    SVG_KEY: 'codeView'
  });

  Object.assign(FE.POPUP_TEMPLATES, {
    'textColor.picker': '[_BUTTONS_][_TEXT_COLORS_][_CUSTOM_COLOR_]',
    'backgroundColor.picker': '[_BUTTONS_][_BACKGROUND_COLORS_][_CUSTOM_COLOR_]'
  }); // Extend defaults.

  Object.assign(FE.DEFAULTS, {
    colorsText: ['#61BD6D', '#1ABC9C', '#54ACD2', '#2C82C9', '#9365B8', '#475577', '#CCCCCC', '#41A85F', '#00A885', '#3D8EB9', '#2969B0', '#553982', '#28324E', '#000000', '#F7DA64', '#FBA026', '#EB6B56', '#E25041', '#A38F84', '#EFEFEF', '#FFFFFF', '#FAC51C', '#F37934', '#D14841', '#B8312F', '#7C706B', '#D1D5D8', 'REMOVE'],
    colorsBackground: ['#61BD6D', '#1ABC9C', '#54ACD2', '#2C82C9', '#9365B8', '#475577', '#CCCCCC', '#41A85F', '#00A885', '#3D8EB9', '#2969B0', '#553982', '#28324E', '#000000', '#F7DA64', '#FBA026', '#EB6B56', '#E25041', '#A38F84', '#EFEFEF', '#FFFFFF', '#FAC51C', '#F37934', '#D14841', '#B8312F', '#7C706B', '#D1D5D8', 'REMOVE'],
    colorsStep: 7,
    colorsHEXInput: true,
    colorsButtons: ['colorsBack', '|', '-']
  });

  FE.PLUGINS.colors = function (editor) {
    var $ = editor.$;
    var custom_color_template = "<div class=\"fr-color-hex-layer fr-active fr-layer\" id=\"fr-color-hex-layer- \n  ".concat(editor.id, "\"><div class=\"fr-input-line\"><input maxlength=\"7\" id=\"[ID]\"\n  type=\"text\" placeholder=\"").concat(editor.language.translate('HEX Color'), "\" \n  tabIndex=\"1\" aria-required=\"true\"></div><div class=\"fr-action-buttons\"><button \n  type=\"button\" class=\"fr-command fr-submit\" data-cmd=\"[COMMAND]\" tabIndex=\"2\" role=\"button\">\n  ").concat(editor.language.translate('OK'), "</button></div></div>");
    /*
     * Show the colors popup.
     */

    function _showColorsPopup(cmd_type) {
      var $btn = editor.$tb.find(".fr-command[data-cmd=\"".concat(cmd_type, "\"]")); // Get color picker based on command type

      var $popup = editor.popups.get("".concat(cmd_type, ".picker"));
      if (!$popup) $popup = _initColorsPopup(cmd_type);

      if (!$popup.hasClass('fr-active')) {
        // Colors popup
        editor.popups.setContainer("".concat(cmd_type, ".picker"), editor.$tb); // Refresh colors in the current popup

        if (cmd_type === 'textColor') {
          _refreshColor('text');
        } else {
          _refreshColor('background');
        } // Colors popup left and top position.


        if ($btn.isVisible()) {
          var _editor$button$getPos = editor.button.getPosition($btn),
              left = _editor$button$getPos.left,
              top = _editor$button$getPos.top;

          editor.popups.show("".concat(cmd_type, ".picker"), left, top, $btn.outerHeight());
        } else {
          editor.position.forSelection($popup);
          editor.popups.show("".concat(cmd_type, ".picker"));
        }
      }
    }
    /**
     * Init the colors popup.
     */


    function _initColorsPopup(cmd_type) {
      var colors_buttons = '';

      if (editor.opts.toolbarInline) {
        // Colors buttons.
        if (editor.opts.colorsButtons.length > 0) {
          colors_buttons += "<div class=\"fr-buttons fr-colors-buttons fr-tabs\">\n        ".concat(editor.button.buildList(editor.opts.colorsButtons), "\n        </div>");
        }
      } // Custom HEX.


      var custom_color = '';
      var template;

      if (cmd_type === 'textColor') {
        if (editor.opts.colorsHEXInput) {
          custom_color = custom_color_template.replace(/\[ID\]/g, "fr-color-hex-layer-text-".concat(editor.id)).replace(/\[COMMAND\]/g, 'customTextColor');
        } // Template for textColor picker


        template = {
          buttons: colors_buttons,
          text_colors: _colorPickerHTML('text'),
          custom_color: custom_color
        };
      } else {
        if (editor.opts.colorsHEXInput) {
          custom_color = custom_color_template.replace(/\[ID\]/g, "fr-color-hex-layer-background-".concat(editor.id)).replace(/\[COMMAND\]/g, 'customBackgroundColor');
        } // Template for backgroundColor picker


        template = {
          buttons: colors_buttons,
          background_colors: _colorPickerHTML('background'),
          custom_color: custom_color
        };
      } // Create a popup and add accessibility to it


      var $popup = editor.popups.create("".concat(cmd_type, ".picker"), template);

      _addAccessibility($popup, "".concat(cmd_type, ".picker"));

      return $popup;
    }
    /*
     * HTML for the color picker colors.
     */


    function _colorPickerHTML(tab) {
      // Get colors according to tab name.
      var colors = tab === 'text' ? editor.opts.colorsText : editor.opts.colorsBackground; // Create colors html.

      var colors_html = "<div class=\"fr-color-set fr-".concat(tab, "-color fr-selected-set\">"); // Add colors.

      for (var i = 0; i < colors.length; i++) {
        if (i !== 0 && i % editor.opts.colorsStep === 0) {
          colors_html += '<br>';
        }

        if (colors[i] !== 'REMOVE') {
          colors_html += "<span class=\"fr-command fr-select-color\" style=\"background:".concat(colors[i], ";\" \n        tabIndex=\"-1\" aria-selected=\"false\" role=\"button\" data-cmd=\"apply").concat(tab, "Color\" \n        data-param1=\"").concat(colors[i], "\"><span class=\"fr-sr-only\"> ").concat(editor.language.translate('Color')).concat(colors[i], " \n        &nbsp;&nbsp;&nbsp;</span></span>");
        } else {
          colors_html += "<span class=\"fr-command fr-select-color\" data-cmd=\"apply".concat(tab, "Color\"\n         tabIndex=\"-1\" role=\"button\" data-param1=\"REMOVE\" \n         title=\"").concat(editor.language.translate('Clear Formatting'), "\">").concat(editor.icon.create('remove'), " \n        <span class=\"fr-sr-only\"> ").concat(editor.language.translate('Clear Formatting'), " </span></span>");
        }
      }

      return colors_html + '</div>';
    }
    /*
     * Register keyboard events.
     */


    function _addAccessibility($popup, popupName) {
      // Register popup event.
      editor.events.on('popup.tab', function (e) {
        var $focused_item = $(e.currentTarget); // Skip if popup is not visible or focus is elsewere.

        if (!editor.popups.isVisible(popupName) || !$focused_item.is('span')) {
          return true;
        }

        var key_code = e.which;
        var status = true; // Tabbing.

        if (FE.KEYCODE.TAB === key_code) {
          var $tb = $popup.find('.fr-buttons'); // Focus back the popup's toolbar if exists.

          status = !editor.accessibility.focusToolbar($tb, e.shiftKey ? true : false);
        } // Arrows.
        else if (FE.KEYCODE.ARROW_UP === key_code || FE.KEYCODE.ARROW_DOWN === key_code || FE.KEYCODE.ARROW_LEFT === key_code || FE.KEYCODE.ARROW_RIGHT === key_code) {
            if ($focused_item.is('span.fr-select-color')) {
              // Get all current colors.
              var $colors = $focused_item.parent().find('span.fr-select-color'); // Get focused item position.

              var index = $colors.index($focused_item); // Get color matrix dimensions.

              var columns = editor.opts.colorsStep;
              var lines = Math.floor($colors.length / columns); // Get focused item coordinates.

              var column = index % columns;
              var line = Math.floor(index / columns);
              var nextIndex = line * columns + column;
              var dimension = lines * columns; // Calculate next index. Go to the other opposite site of the matrix if there is no next adjacent element.
              // Up/Down: Traverse matrix lines.
              // Left/Right: Traverse the matrix as it is a vector.

              if (FE.KEYCODE.ARROW_UP === key_code) {
                nextIndex = ((nextIndex - columns) % dimension + dimension) % dimension; // Javascript negative modulo bug.
              } else if (FE.KEYCODE.ARROW_DOWN === key_code) {
                nextIndex = (nextIndex + columns) % dimension;
              } else if (FE.KEYCODE.ARROW_LEFT === key_code) {
                nextIndex = ((nextIndex - 1) % dimension + dimension) % dimension; // Javascript negative modulo bug.
              } else if (FE.KEYCODE.ARROW_RIGHT === key_code) {
                nextIndex = (nextIndex + 1) % dimension;
              } // Get the next element based on the new index.


              var $el = $($colors.get(nextIndex)); // Focus.

              editor.events.disableBlur();
              $el.focus();
              status = false;
            }
          } // ENTER or SPACE.
          else if (FE.KEYCODE.ENTER === key_code) {
              editor.button.exec($focused_item);
              status = false;
            } // Prevent propagation.


        if (status === false) {
          e.preventDefault();
          e.stopPropagation();
        }

        return status;
      }, true);
    }
    /*
     * Show the current selected color.
     */


    function _refreshColor(tab) {
      var $popup = editor.popups.get("".concat(tab, "Color.picker"));
      var $element = $(editor.selection.element()); // The color css property.

      var color_type;

      if (tab === 'background') {
        color_type = 'background-color';
      } else {
        color_type = 'color';
      }

      var $current_color = $popup.find(".fr-".concat(tab, "-color .fr-select-color")); // Remove current color selection.

      $current_color.find('.fr-selected-color').remove();
      $current_color.removeClass('fr-active-item');
      $current_color.not('[data-param1="REMOVE"]').attr('aria-selected', false); // Find the selected color.

      while ($element.get(0) !== editor.el) {
        // Transparent or black.
        if ($element.css(color_type) === 'transparent' || $element.css(color_type) === 'rgba(0, 0, 0, 0)') {
          $element = $element.parent();
        } // Select the correct color.
        else {
            var $select_color = $popup.find(".fr-".concat(tab, "-color .fr-select-color[data-param1=\"").concat(editor.helpers.RGBToHex($element.css(color_type)), "\"]")); // Add checked icon.

            $select_color.append("<span class=\"fr-selected-color\" aria-hidden=\"true\">\uF00C</span>");
            $select_color.addClass('fr-active-item').attr('aria-selected', true);
            break;
          }
      }

      _updateColor(tab);
    }

    function _updateColor(val) {
      var $popup = editor.popups.get("".concat(val, "Color.picker"));
      var $selectionColor = $popup.find(".fr-".concat(val, "-color .fr-active-item")).attr('data-param1');
      var $input = $popup.find('.fr-color-hex-layer input');

      if (!$selectionColor) {
        $selectionColor = '';
      }

      if ($input.length) {
        $($input.val($selectionColor).input).trigger('change');
      }
    }
    /*
     * Change background color.
     */


    function background(val) {
      // Set background  color.
      if (val !== 'REMOVE') {
        editor.format.applyStyle('background-color', editor.helpers.HEXtoRGB(val));
      } // Remove background color.
      else {
          editor.format.removeStyle('background-color');
        }

      editor.popups.hide('backgroundColor.picker');
    }
    /*
     * Change text color.
     */


    function text(val) {
      // Set text color.
      if (val !== 'REMOVE') {
        editor.format.applyStyle('color', editor.helpers.HEXtoRGB(val));
      } // Remove text color.
      else {
          editor.format.removeStyle('color');
        }

      editor.popups.hide('textColor.picker');
    }
    /*
     * Go back to the inline editor.
     */


    function back() {
      editor.popups.hide('textColor.picker');
      editor.popups.hide('backgroundColor.picker');
      editor.toolbar.showInline();
    }

    function customColor(tab) {
      var $popup = editor.popups.get("".concat(tab, "Color.picker"));
      var $input = $popup.find('.fr-color-hex-layer input');

      if ($input.length) {
        var color = $input.val(); // Set custom color

        if (tab === 'background') {
          background(color);
        } else {
          text(color);
        }
      }
    }

    return {
      showColorsPopup: _showColorsPopup,
      background: background,
      customColor: customColor,
      text: text,
      back: back
    };
  }; // Select text color command.


  FE.DefineIcon('textColor', {
    NAME: 'tint',
    SVG_KEY: 'textColor'
  });
  FE.RegisterCommand('textColor', {
    title: 'Text Color',
    undo: false,
    focus: true,
    refreshOnCallback: false,
    popup: true,
    callback: function callback() {
      if (!this.popups.isVisible('textColor.picker')) {
        this.colors.showColorsPopup('textColor');
      } else {
        if (this.$el.find('.fr-marker').length) {
          this.events.disableBlur();
          this.selection.restore();
        }

        this.popups.hide('textColor.picker');
      }
    }
  }); // Command to apply text color from the available colors

  FE.RegisterCommand('applytextColor', {
    undo: true,
    callback: function callback(cmd, val) {
      this.colors.text(val);
    }
  }); // Command to set custom text color

  FE.RegisterCommand('customTextColor', {
    title: 'OK',
    undo: true,
    callback: function callback() {
      this.colors.customColor('text');
    }
  }); // Select background color command.

  FE.DefineIcon('backgroundColor', {
    NAME: 'paint-brush',
    SVG_KEY: 'backgroundColor'
  });
  FE.RegisterCommand('backgroundColor', {
    title: 'Background Color',
    undo: false,
    focus: true,
    refreshOnCallback: false,
    popup: true,
    callback: function callback() {
      if (!this.popups.isVisible('backgroundColor.picker')) {
        this.colors.showColorsPopup('backgroundColor');
      } else {
        if (this.$el.find('.fr-marker').length) {
          this.events.disableBlur();
          this.selection.restore();
        }

        this.popups.hide('backgroundColor.picker');
      }
    }
  }); // Command to apply background color from the available colors

  FE.RegisterCommand('applybackgroundColor', {
    undo: true,
    callback: function callback(cmd, val) {
      this.colors.background(val);
    }
  }); // Command to set custom background color

  FE.RegisterCommand('customBackgroundColor', {
    title: 'OK',
    undo: true,
    callback: function callback() {
      this.colors.customColor('background');
    }
  }); // Colors back.

  FE.DefineIcon('colorsBack', {
    NAME: 'arrow-left',
    SVG_KEY: 'back'
  });
  FE.RegisterCommand('colorsBack', {
    title: 'Back',
    undo: false,
    focus: false,
    back: true,
    refreshAfterCallback: false,
    callback: function callback() {
      this.colors.back();
    }
  });
  FE.DefineIcon('remove', {
    NAME: 'eraser',
    SVG_KEY: 'remove'
  });

  Object.assign(FE.DEFAULTS, {
    dragInline: true
  });

  FE.PLUGINS.draggable = function (editor) {
    var $ = editor.$;

    function _dragStart(e) {
      if (e.originalEvent && e.originalEvent.target && e.originalEvent.target.nodeType === Node.TEXT_NODE) {
        return true;
      } // Image with link.


      if (e.target && e.target.tagName === 'A' && e.target.childNodes.length === 1 && e.target.childNodes[0].tagName === 'IMG') {
        e.target = e.target.childNodes[0];
      }

      if (!$(e.target).hasClass('fr-draggable')) {
        e.preventDefault();
        return false;
      } // Save in undo step if we cannot do.


      if (!editor.undo.canDo()) {
        editor.undo.saveStep();
      }

      if (editor.opts.dragInline) {
        editor.$el.attr('contenteditable', true);
      } else {
        editor.$el.attr('contenteditable', false);
      }

      if (editor.opts.toolbarInline) editor.toolbar.hide();
      $(e.target).addClass('fr-dragging');

      if (!editor.browser.msie && !editor.browser.edge) {
        editor.selection.clear();
      }

      e.originalEvent.dataTransfer.setData('text', 'Froala');
    }

    function _tagOK(tag_under) {
      return !(tag_under && (tag_under.tagName === 'HTML' || tag_under.tagName === 'BODY' || editor.node.isElement(tag_under)));
    }

    function _setHelperSize(top, left, width) {
      if (editor.opts.iframe) {
        var iframePaddingTop = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-top'));
        var iframePaddingLeft = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-left'));
        top += editor.$iframe.offset().top + iframePaddingTop;
        left += editor.$iframe.offset().left + iframePaddingLeft;
      }

      if ($draggable_helper.offset().top !== top) $draggable_helper.css('top', top);
      if ($draggable_helper.offset().left !== left) $draggable_helper.css('left', left);
      if ($draggable_helper.width() !== width) $draggable_helper.css('width', width);
    }

    function _positionHelper(e) {
      // The tag under the mouse cursor.
      var tag_under = editor.doc.elementFromPoint(e.originalEvent.pageX - editor.win.pageXOffset, e.originalEvent.pageY - editor.win.pageYOffset);

      if (!_tagOK(tag_under)) {
        // Look above for the closest tag.
        var top_offset = 0;
        var top_tag = tag_under;

        while (!_tagOK(top_tag) && top_tag === tag_under && e.originalEvent.pageY - editor.win.pageYOffset - top_offset > 0) {
          top_offset++;
          top_tag = editor.doc.elementFromPoint(e.originalEvent.pageX - editor.win.pageXOffset, e.originalEvent.pageY - editor.win.pageYOffset - top_offset);
        }

        if (!_tagOK(top_tag) || $draggable_helper && editor.$el.find(top_tag).length === 0 && top_tag !== $draggable_helper.get(0)) {
          top_tag = null;
        } // Look below for the closest tag.


        var bottom_offset = 0;
        var bottom_tag = tag_under;

        while (!_tagOK(bottom_tag) && bottom_tag === tag_under && e.originalEvent.pageY - editor.win.pageYOffset + bottom_offset < $(editor.doc).height()) {
          bottom_offset++;
          bottom_tag = editor.doc.elementFromPoint(e.originalEvent.pageX - editor.win.pageXOffset, e.originalEvent.pageY - editor.win.pageYOffset + bottom_offset);
        }

        if (!_tagOK(bottom_tag) || $draggable_helper && editor.$el.find(bottom_tag).length === 0 && bottom_tag !== $draggable_helper.get(0)) {
          bottom_tag = null;
        }

        if (bottom_tag === null && top_tag) tag_under = top_tag;else if (bottom_tag && top_tag === null) tag_under = bottom_tag;else if (bottom_tag && top_tag) {
          tag_under = top_offset < bottom_offset ? top_tag : bottom_tag;
        } else {
          tag_under = null;
        }
      } // Stop if tag under is draggable helper.


      if ($(tag_under).hasClass('fr-drag-helper')) return false; // Get block parent.

      if (tag_under && !editor.node.isBlock(tag_under)) {
        tag_under = editor.node.blockParent(tag_under);
      } // Normalize TABLE parent.


      if (tag_under && ['TD', 'TH', 'TR', 'THEAD', 'TBODY'].indexOf(tag_under.tagName) >= 0) {
        tag_under = $(tag_under).parents('table').get(0);
      } // Normalize LIST parent.


      if (tag_under && ['LI'].indexOf(tag_under.tagName) >= 0) {
        tag_under = $(tag_under).parents('UL, OL').get(0);
      }

      if (tag_under && !$(tag_under).hasClass('fr-drag-helper')) {
        // Init helper.
        if (!$draggable_helper) {
          if (!FE.$draggable_helper) FE.$draggable_helper = $(document.createElement('div')).attr('class', 'fr-drag-helper');
          $draggable_helper = FE.$draggable_helper;
          editor.events.on('shared.destroy', function () {
            $draggable_helper.html('').removeData().remove();
            $draggable_helper = null;
          }, true);
        }

        var above;
        var mouse_y = e.originalEvent.pageY;
        if (mouse_y < $(tag_under).offset().top + $(tag_under).outerHeight() / 2) above = true;else above = false;
        var $tag_under = $(tag_under);
        var margin = 0; // Should go below and there is no tag below.

        if (!above && $tag_under.next().length === 0) {
          if ($draggable_helper.data('fr-position') !== 'after' || !$tag_under.is($draggable_helper.data('fr-tag'))) {
            margin = parseFloat($tag_under.css('margin-bottom')) || 0;

            _setHelperSize($tag_under.offset().top + $(tag_under).height() + margin / 2 - editor.$box.offset().top, $tag_under.offset().left - editor.win.pageXOffset - editor.$box.offset().left, $tag_under.width());

            $draggable_helper.data('fr-position', 'after');
          }
        } else {
          // Should go below then we take the next tag.
          if (!above) {
            $tag_under = $tag_under.next();
          }

          if ($draggable_helper.data('fr-position') !== 'before' || !$tag_under.is($draggable_helper.data('fr-tag'))) {
            if ($tag_under.prev().length > 0) {
              margin = parseFloat($tag_under.prev().css('margin-bottom')) || 0;
            }

            margin = Math.max(margin, parseFloat($tag_under.css('margin-top')) || 0);

            _setHelperSize($tag_under.offset().top - margin / 2 - editor.$box.offset().top, $tag_under.offset().left - editor.win.pageXOffset - editor.$box.offset().left, $tag_under.width());

            $draggable_helper.data('fr-position', 'before');
          }
        }

        $draggable_helper.data('fr-tag', $tag_under);
        $draggable_helper.addClass('fr-visible');
        editor.$box.append($draggable_helper);
      } else if ($draggable_helper && editor.$box.find($draggable_helper).length > 0) {
        $draggable_helper.removeClass('fr-visible');
      }
    }

    function _dragOver(e) {
      e.originalEvent.dataTransfer.dropEffect = 'move';

      if (!editor.opts.dragInline) {
        e.preventDefault();

        _positionHelper(e);
      } else if (!_getDraggedEl() || editor.browser.msie || editor.browser.edge) {
        e.preventDefault();
      }
    }

    function _dragEnter(e) {
      e.originalEvent.dataTransfer.dropEffect = 'move';

      if (!editor.opts.dragInline) {
        e.preventDefault();
      }
    }

    function _documentDragEnd(e) {
      editor.$el.attr('contenteditable', true);
      var $draggedEl = editor.$el.find('.fr-dragging');

      if ($draggable_helper && $draggable_helper.hasClass('fr-visible') && editor.$box.find($draggable_helper).length) {
        _drop(e);
      } else if ($draggedEl.length) {
        e.preventDefault();
        e.stopPropagation();
      }

      if ($draggable_helper && editor.$box.find($draggable_helper).length) {
        $draggable_helper.removeClass('fr-visible');
      }

      $draggedEl.removeClass('fr-dragging');
    }

    function _getDraggedEl() {
      var $draggedEl = null; // Search of the instance we're dragging from.

      for (var i = 0; i < FE.INSTANCES.length; i++) {
        $draggedEl = FE.INSTANCES[i].$el.find('.fr-dragging');

        if ($draggedEl.length) {
          return $draggedEl.get(0);
        }
      }
    }

    function _drop(e) {
      editor.$el.attr('contenteditable', true);
      var $draggedEl;
      var inst; // Inst is the intance we're dragging from.

      for (var i = 0; i < FE.INSTANCES.length; i++) {
        $draggedEl = FE.INSTANCES[i].$el.find('.fr-dragging');

        if ($draggedEl.length) {
          inst = FE.INSTANCES[i];
          break;
        }
      } // There is a dragged element.


      if ($draggedEl.length) {
        // Cancel anything else.
        e.preventDefault();
        e.stopPropagation(); // Look for draggable helper.

        if ($draggable_helper && $draggable_helper.hasClass('fr-visible') && editor.$box.find($draggable_helper).length) {
          $draggable_helper.data('fr-tag')[$draggable_helper.data('fr-position')]('<span class="fr-marker"></span>');
          $draggable_helper.removeClass('fr-visible');
        } else {
          var ok = editor.markers.insertAtPoint(e.originalEvent);
          if (ok === false) return false;
        } // Remove dragging class.


        $draggedEl.removeClass('fr-dragging');
        $draggedEl = editor.events.chainTrigger('element.beforeDrop', $draggedEl);

        if ($draggedEl === false) {
          return false;
        } // Image with link.


        var $droppedEl = $draggedEl;

        if ($draggedEl.parent().is('A') && $draggedEl.parent().get(0).childNodes.length === 1) {
          $droppedEl = $draggedEl.parent();
        } // Replace marker with the dragged element.


        if (!editor.core.isEmpty()) {
          var $marker = editor.$el.find('.fr-marker');
          $marker.replaceWith(FE.MARKERS);
          editor.selection.restore();
        } else {
          editor.events.focus();
        } // Save undo step if the current instance is different than the original one.


        if (inst !== editor && !editor.undo.canDo()) editor.undo.saveStep(); // Place new elements.

        if (!editor.core.isEmpty()) {
          var marker = editor.markers.insert(); // Make sure we do not have marker inside $droppedEl.

          if ($droppedEl.find(marker).length === 0) {
            $(marker).replaceWith($droppedEl);
          } else if ($draggedEl.find(marker).length === 0) {
            $(marker).replaceWith($draggedEl);
          }

          $draggedEl.after(FE.MARKERS);
          editor.selection.restore();
        } else {
          editor.$el.html($droppedEl);
        } // Hide all popups.


        editor.popups.hideAll();
        editor.selection.save();
        editor.$el.find(editor.html.emptyBlockTagsQuery()).not('TD, TH, LI, .fr-inner').not(editor.opts.htmlAllowedEmptyTags.join(',')).remove();
        editor.html.wrap();
        editor.html.fillEmptyBlocks();
        editor.selection.restore();
        editor.undo.saveStep();
        if (editor.opts.iframe) editor.size.syncIframe(); // Mark changes in the original instance as well.

        if (inst !== editor) {
          inst.popups.hideAll();
          inst.$el.find(inst.html.emptyBlockTagsQuery()).not('TD, TH, LI, .fr-inner').remove();
          inst.html.wrap();
          inst.html.fillEmptyBlocks();
          inst.undo.saveStep();
          inst.events.trigger('element.dropped');
          if (inst.opts.iframe) inst.size.syncIframe();
        }

        editor.events.trigger('element.dropped', [$droppedEl]); // Stop bubbling.

        return false;
      } // Save step when something else is dragged into the editor.
      else {
          if ($draggable_helper) $draggable_helper.removeClass('fr-visible');
          if (!editor.undo.canDo()) editor.undo.saveStep();
          setTimeout(function () {
            editor.undo.saveStep();
          }, 0);
        }
    }
    /**
     * Do cleanup when the html is taken.
     */


    function _cleanOnGet(el) {
      // Remove drag helper.
      if (el && el.tagName === 'DIV' && editor.node.hasClass(el, 'fr-drag-helper')) {
        el.parentNode.removeChild(el);
      } // Remove from nested elements too.
      else if (el && el.nodeType === Node.ELEMENT_NODE) {
          var els = el.querySelectorAll('div.fr-drag-helper');

          for (var i = 0; i < els.length; i++) {
            els[i].parentNode.removeChild(els[i]);
          }
        }
    }
    /*
     * Initialize.
     */


    var $draggable_helper;

    function _init() {
      // Force drag inline when ENTER_BR is active.
      if (editor.opts.enter === FE.ENTER_BR) editor.opts.dragInline = true; // Starting to drag.

      editor.events.on('dragstart', _dragStart, true); // Inline dragging is off.

      editor.events.on('dragover', _dragOver, true);
      editor.events.on('dragenter', _dragEnter, true); // Document drop. Remove moving class.

      editor.events.on('document.dragend', _documentDragEnd, true);
      editor.events.on('document.drop', _documentDragEnd, true); // Drop.

      editor.events.on('drop', _drop, true); // Clean getting the HTML.

      editor.events.on('html.processGet', _cleanOnGet);
    }

    return {
      _init: _init
    };
  };

  Object.assign(FE.DEFAULTS, {
    editInPopup: false
  });

  FE.MODULES.editInPopup = function (editor) {
    function _initPopup() {
      // Image buttons.
      var txt = "<div id=\"fr-text-edit-".concat(editor.id, "\" class=\"fr-layer fr-text-edit-layer\"><div class=\"fr-input-line\"><input type=\"text\" placeholder=\"").concat(editor.language.translate('Text'), "\" tabIndex=\"1\"></div><div class=\"fr-action-buttons\"><button type=\"button\" class=\"fr-command fr-submit\" data-cmd=\"updateText\" tabIndex=\"2\">").concat(editor.language.translate('Update'), "</button></div></div>");
      var template = {
        edit: txt
      };
      editor.popups.create('text.edit', template);
    }

    function _showPopup() {
      var $popup = editor.popups.get('text.edit');
      var text;

      if (editor.el.tagName === 'INPUT') {
        text = editor.$el.attr('placeholder');
      } else {
        text = editor.$el.text();
      }

      $popup.find('input').val(text).trigger('change');
      editor.popups.setContainer('text.edit', editor.$sc);
      editor.popups.show('text.edit', editor.$el.offset().left + editor.$el.outerWidth() / 2, editor.$el.offset().top + editor.$el.outerHeight(), editor.$el.outerHeight());
    }

    function _initEvents() {
      // Show edit popup.
      editor.events.$on(editor.$el, editor._mouseup, function () {
        setTimeout(function () {
          _showPopup();
        }, 10);
      });
    }

    function update() {
      var $popup = editor.popups.get('text.edit');
      var new_text = $popup.find('input').val();

      if (new_text.length === 0) {
        new_text = editor.opts.placeholderText;
      }

      if (editor.el.tagName === 'INPUT') {
        editor.$el.attr('placeholder', new_text);
      } else {
        editor.$el.text(new_text);
      }

      editor.events.trigger('contentChanged');
      editor.popups.hide('text.edit');
    }
    /**
     * Initialize.
     */


    function _init() {
      if (editor.opts.editInPopup) {
        _initPopup();

        _initEvents();
      }
    }

    return {
      _init: _init,
      update: update
    };
  };

  FE.RegisterCommand('updateText', {
    focus: false,
    undo: false,
    callback: function callback() {
      this.editInPopup.update();
    }
  });

  Object.assign(FE.POPUP_TEMPLATES, {
    emoticons: '[_BUTTONS_][_CUSTOM_LAYER_]'
  }); // Extend defaults.

  Object.assign(FE.DEFAULTS, {
    emoticonsSet: [{
      'id': 'people',
      'name': 'Smileys & People',
      'code': '1f600',
      'emoticons': [{
        code: '1f600',
        desc: 'Grinning face'
      }, {
        code: '1f601',
        desc: 'Grinning Face with Smiling Eyes'
      }, {
        code: '1f602',
        desc: 'Face with Tears of Joy'
      }, {
        code: '1f603',
        desc: 'Smiling Face with Open Mouth'
      }, {
        code: '1f604',
        desc: 'Smiling Face with Open Mouth and Smiling Eyes'
      }, {
        code: '1f605',
        desc: 'Smiling Face with Open Mouth and Cold Sweat'
      }, {
        code: '1f606',
        desc: 'Smiling Face with Open Mouth and Tightly-Closed Eyes'
      }, {
        code: '1f609',
        desc: 'Winking Face'
      }, {
        code: '1f60a',
        desc: 'Smiling Face with Smiling Eyes'
      }, {
        code: '1f608',
        desc: 'Face Savouring Delicious Food'
      }, {
        code: '1f60e',
        desc: 'Smiling Face with Sunglasses'
      }, {
        code: '1f60d',
        desc: 'Smiling Face with Heart-Shaped Eyes'
      }, {
        code: '1f618',
        desc: 'Face Throwing a Kiss'
      }, {
        code: '1f617',
        desc: 'Kissing Face'
      }, {
        code: '1f619',
        desc: 'Kissing Face with Smiling Eyes'
      }, {
        code: '1f61a',
        desc: 'Kissing Face with Closed Eyes'
      }, {
        code: '263a',
        desc: 'White Smiling Face'
      }, {
        code: '1f642',
        desc: 'Slightly Smiling Face'
      }, {
        code: '1f610',
        desc: 'Neutral Face'
      }, {
        code: '1f611',
        desc: 'Expressionless Face'
      }, {
        code: '1f636',
        desc: 'Face Without Mouth'
      }, {
        code: '1f60f',
        desc: 'Smirking Face'
      }, {
        code: '1f623',
        desc: 'Persevering Face'
      }, {
        code: '1f625',
        desc: 'Disappointed but Relieved Face'
      }, {
        code: '1f62e',
        desc: 'Face with Open Mouth'
      }, {
        code: '1f62f',
        desc: 'Hushed Face'
      }, {
        code: '1f62a',
        desc: 'Sleepy Face'
      }, {
        code: '1f62b',
        desc: 'Tired Face'
      }, {
        code: '1f634',
        desc: 'Sleeping Face'
      }, {
        code: '1f60c',
        desc: 'Relieved Face'
      }, {
        code: '1f61b',
        desc: 'Face with Stuck-out Tongue'
      }, {
        code: '1f61c',
        desc: 'Face with Stuck-out Tongue and Winking Eye'
      }, {
        code: '1f61d',
        desc: 'Face with Stuck-out Tongue and Tightly-Closed Eyes'
      }, {
        code: '1f612',
        desc: 'Unamused Face'
      }, {
        code: '1f613',
        desc: 'Face with Cold Sweat'
      }, {
        code: '1f613',
        desc: 'Face with Cold Sweat'
      }, {
        code: '1f614',
        desc: 'Pensive Face'
      }, {
        code: '1f615',
        desc: 'Confused Face'
      }, {
        code: '1f632',
        desc: 'Astonished  Face'
      }, {
        code: '1f616',
        desc: 'Confounded Face'
      }, {
        code: '1f61e',
        desc: 'Disappointed Face'
      }, {
        code: '1f61f',
        desc: 'Worried Face'
      }, {
        code: '1f624',
        desc: 'Face with Look of Triumph'
      }, {
        code: '1f622',
        desc: 'Crying Face'
      }, {
        code: '1f62d',
        desc: 'Loudly Crying Face'
      }, {
        code: '1f626',
        desc: 'Frowning Face with Open Mouth'
      }, {
        code: '1f627',
        desc: 'Anguished Face'
      }, {
        code: '1f628',
        desc: 'Fearful Face'
      }, {
        code: '1f629',
        desc: 'Weary Face'
      }, {
        code: '1f62c',
        desc: 'Grimacing Face'
      }, {
        code: '1f630',
        desc: 'Face with Open Mouth and Cold Sweat'
      }, {
        code: '1f631',
        desc: 'Face Screaming in Fear'
      }, {
        code: '1f633',
        desc: 'Flushed Face'
      }, {
        code: '1f635',
        desc: 'Dizzy Face'
      }, {
        code: '1f621',
        desc: 'Pouting Face'
      }, {
        code: '1f620',
        desc: 'Angry Face'
      }, {
        code: '1f637',
        desc: 'Face with Medical Mask'
      }, {
        code: '1f607',
        desc: 'Smiling Face with Halo'
      }, {
        code: '1f608',
        desc: 'Smiling Face with Horns'
      }, {
        code: '1f47f',
        desc: 'Imp'
      }, {
        code: '1f479',
        desc: 'Japanese Ogre'
      }, {
        code: '1f47a',
        desc: 'Japanese Goblin'
      }, {
        code: '1f480',
        desc: 'Skull'
      }, {
        code: '1f47b',
        desc: 'Ghost'
      }, {
        code: '1f47d',
        desc: 'Extraterrestrial Alien'
      }, {
        code: '1f47e',
        desc: 'Alien Monster'
      }, {
        code: '1f4a9',
        desc: 'Pile of Poo'
      }, {
        code: '1f63a',
        desc: 'Smiling Cat Face with Open Mouth'
      }, {
        code: '1f638',
        desc: 'Grinning Cat Face with Smiling Eyes'
      }, {
        code: '1f639',
        desc: 'Cat Face with Tears of Joy'
      }, {
        code: '1f63b',
        desc: 'Smiling Cat Face with Heart-Shaped Eyes'
      }, {
        code: '1f63c',
        desc: 'Cat Face with Wry Smile'
      }, {
        code: '1f63d',
        desc: 'Kissing Cat Face with Closed Eyes'
      }, {
        code: '1f640',
        desc: 'Weary Cat Face'
      }, {
        code: '1f63f',
        desc: 'Crying Cat Face'
      }, {
        code: '1f63e',
        desc: 'Pouting Cat Face'
      }, {
        code: '1f648',
        desc: 'See-No-Evil Monkey'
      }, {
        code: '1f649',
        desc: 'Hear-No-Evil Monkey'
      }, {
        code: '1f64a',
        desc: 'Speak-No-Evil Monkey'
      }, {
        code: '1f476',
        desc: 'Baby'
      }, {
        code: '1f466',
        desc: 'Boy'
      }, {
        code: '1f467',
        desc: 'Girl'
      }, {
        code: '1f468',
        desc: 'Man'
      }, {
        code: '1f469',
        desc: 'Woman'
      }, {
        code: '1f474',
        desc: 'Older Man'
      }, {
        code: '1f475',
        desc: 'Older Woman'
      }, {
        code: '1f46e',
        desc: 'Police Officer'
      }, {
        code: '1f482',
        desc: ' Guardsman'
      }, {
        code: '1f477',
        desc: ' Construction Worker'
      }, {
        code: '1f478',
        desc: 'Princess'
      }, {
        code: '1f473',
        desc: 'Man with Turban'
      }, {
        code: '1f472',
        desc: 'Man with Gua Pi Mao'
      }, {
        code: '1f471',
        desc: 'Person with Blond Hair'
      }, {
        code: '1f470',
        desc: 'Bride with Veil'
      }, {
        code: '1f47c',
        desc: 'Baby Angel'
      }, {
        code: '1f385',
        desc: 'Father Christmas'
      }, {
        code: '1f64e',
        desc: 'Person with Pouting Face'
      }, {
        code: '1f645',
        desc: 'Face with No Good Gesture'
      }, {
        code: '1f646',
        desc: 'Face with Ok Gesture'
      }, {
        code: '1f481',
        desc: 'Information Desk Person'
      }, {
        code: '1f64b',
        desc: 'Happy Person Raising One Hand'
      }, {
        code: '1f647',
        desc: 'Person Bowing Deeply'
      }, {
        code: '1f486',
        desc: 'Face Massage'
      }, {
        code: '1f487',
        desc: 'Haircut'
      }, {
        code: '1f6b6',
        desc: 'Pedestrian'
      }, {
        code: '1f3c3',
        desc: 'Runner'
      }, {
        code: '1f483',
        desc: 'Dancer'
      }, {
        code: '1f46f',
        desc: 'Woman with Bunny Ears'
      }, {
        code: '1f6c0',
        desc: 'Bath'
      }, {
        code: '1f464',
        desc: 'Bust in Silhouette'
      }, {
        code: '1f465',
        desc: 'Busts in Silhouette'
      }, {
        code: '1f3c7',
        desc: 'Horse Racing'
      }, {
        code: '1f3c2',
        desc: ' Snowboarder'
      }, {
        code: '1f3c4',
        desc: ' Surfer'
      }, {
        code: '1f6a3',
        desc: ' Rowboat'
      }, {
        code: '1f3ca',
        desc: ' Swimmer'
      }, {
        code: '1f6b4',
        desc: ' Bicyclist'
      }, {
        code: '1f6b5',
        desc: 'Mountain Bicyclist'
      }, {
        code: '1f46b',
        desc: ' Man and Woman Holding Hands'
      }, {
        code: '1f46c',
        desc: 'Two Men Holding Hands'
      }, {
        code: '1f46d',
        desc: 'Two Women Holding Hands'
      }, {
        code: '1f48f',
        desc: 'Kiss'
      }, {
        code: '1f468-2764-1f48b-1f468',
        uCode: "\uD83D\uDC68\u200D\u2764\uFE0F\u200D\uD83D\uDC8B\u200D\uD83D\uDC68",
        desc: 'Man Kiss Man'
      }, {
        code: '1f469-2764-1f48b-1f469',
        uCode: "\uD83D\uDC69\u200D\u2764\uFE0F\u200D\uD83D\uDC69",
        desc: 'Woman Kiss Woman'
      }, {
        code: '1f491',
        desc: 'Couple with Heart'
      }, {
        code: '1f468-2764-1f468',
        uCode: "\uD83D\uDC68\u200D\u2764\uFE0F\u200D\uD83D\uDC68",
        desc: 'Man Heart Man'
      }, {
        code: '1f469-2764-1f469',
        uCode: "\uD83D\uDC69\u200D\u2764\uFE0F\u200D\uD83D\uDC69",
        desc: 'Woman Heart Woman'
      }, {
        code: '1f46a',
        desc: 'Family'
      }, {
        code: '1f468',
        desc: 'Man Woman Boy'
      }, {
        code: '1f468-1f469-1f467',
        desc: 'Man Woman Girl'
      }, {
        code: '1f468-1f469-1f467-1f466',
        desc: 'Man Woman Girl Boy'
      }, {
        code: '1f468-1f469-1f466-1f466',
        desc: 'Man Woman Boy Boy'
      }, {
        code: '1f468-1f469-1f467-1f467',
        desc: 'Man Woman Girl Girl'
      }, {
        code: '1f468-1f468-1f466',
        desc: 'Man Man Boy'
      }, {
        code: '1f468-1f468-1f467',
        desc: 'Man Man Girl'
      }, {
        code: '1f468-1f468-1f467-1f466',
        desc: 'Man Man Girl Boy'
      }, {
        code: '1f468-1f468-1f466-1f466',
        desc: 'Man Man Boy Boy'
      }, {
        code: '1f469-1f469-1f466',
        desc: 'Woman Woman Boy'
      }, {
        code: '1f469-1f469-1f467',
        desc: 'Woman Woman Girl'
      }, {
        code: '1f469-1f469-1f467-1f466',
        desc: 'Woman Woman Girl Boy'
      }, {
        code: '1f469-1f469-1f467-1f467',
        desc: 'Woman Woman Girl Girl'
      }, {
        code: '1f4aa',
        desc: 'Flexed Biceps'
      }, {
        code: '1f448',
        desc: 'White Left Pointing Backhand Index'
      }, {
        code: '1f449',
        desc: 'White Right Pointing Backhand Index'
      }, {
        code: '1f446',
        desc: 'White Up Pointing Backhand Index'
      }, {
        code: '1f447',
        desc: 'White Down Pointing Backhand Index'
      }, {
        code: '270c',
        desc: 'Victory Hand'
      }, {
        code: '270b',
        desc: 'Raised Hand'
      }, {
        code: '1f44c',
        desc: 'Ok Hand Sign'
      }, {
        code: '1f44d',
        desc: 'Thumbs Up Sign'
      }, {
        code: '1f44e',
        desc: 'Thumbs Down Sign'
      }, {
        code: '270a',
        desc: 'Raised Fist'
      }, {
        code: '1f44a',
        desc: 'Fisted Hand Sign'
      }, {
        code: '1f44b',
        desc: 'Waving Hand Sign'
      }, {
        code: '1f44f',
        desc: 'Clapping Hands Sign'
      }, {
        code: '1f450',
        desc: 'Open  Hands Sign'
      }, {
        code: '1f64c',
        desc: 'Person Raising Both Hands in Celebration'
      }, {
        code: '1f64f',
        desc: 'Person with Folded Hands'
      }, {
        code: '1f485',
        desc: 'Nail Polish'
      }, {
        code: '1f442',
        desc: 'Ear'
      }, {
        code: '1f443',
        desc: 'Nose'
      }, {
        code: '1f463',
        desc: 'Footprints'
      }, {
        code: '1f440',
        desc: 'Eyes'
      }, {
        code: '1f445',
        desc: 'Tongue'
      }, {
        code: '1f444',
        desc: 'Mouth'
      }, {
        code: '1f48b',
        desc: 'Kiss Mark'
      }, {
        code: '1f498',
        desc: 'Heart with Arrow'
      }, {
        code: '2764',
        desc: 'Heavy Black Heart'
      }, {
        code: '1f493',
        desc: 'Heavy Black Heart'
      }, {
        code: '1f494',
        desc: 'Broken Heart'
      }, {
        code: '1f495',
        desc: 'Two Hearts'
      }, {
        code: '1f496',
        desc: 'Sparkling Hearts'
      }, {
        code: '1f497',
        desc: 'Growing Hearts'
      }, {
        code: '1f499',
        desc: 'Blue Heart'
      }, {
        code: '1f49a',
        desc: 'Green Heart'
      }, {
        code: '1f49b',
        desc: 'Yellow Heart'
      }, {
        code: '1f49c',
        desc: 'Purple Heart'
      }, {
        code: '1f49d',
        desc: 'Heart with Ribbon'
      }, {
        code: '1f49e',
        desc: 'Revolving Hearts'
      }, {
        code: '1f49f',
        desc: 'Heart Decoration'
      }, {
        code: '1f48c',
        desc: 'Love Letter'
      }, {
        code: '1f4a4',
        desc: 'Sleeping Symbol'
      }, {
        code: '1f4a2',
        desc: 'Anger Symbol'
      }, {
        code: '1f4a3',
        desc: 'Bomb'
      }, {
        code: '1f4a5',
        desc: 'Collision Symbol'
      }, {
        code: '1f4a6',
        desc: 'Splashing Sweat Symbol'
      }, {
        code: '1f4a8',
        desc: 'Dash Symbol'
      }, {
        code: '1f4ab',
        desc: 'Dizzy Symbol'
      }, {
        code: '1f4ab',
        desc: 'Dizzy Symbol'
      }, {
        code: '1f4ac',
        desc: 'Speech Balloon'
      }, {
        code: '1f4ad',
        desc: 'Thought Balloon'
      }, {
        code: '1f453',
        desc: 'Eyeglasses'
      }, {
        code: '1f454',
        desc: 'Necktie'
      }, {
        code: '1f455',
        desc: 'T-Shirt'
      }, {
        code: '1f456',
        desc: 'Jeans'
      }, {
        code: '1f457',
        desc: 'Dress'
      }, {
        code: '1f458',
        desc: 'Kimono'
      }, {
        code: '1f459',
        desc: 'Bikini'
      }, {
        code: '1f45a',
        desc: 'Womans Clothes'
      }, {
        code: '1f45b',
        desc: 'Purse'
      }, {
        code: '1f45c',
        desc: 'Handbag'
      }, {
        code: '1f45d',
        desc: 'Pouch'
      }, {
        code: '1f392',
        desc: 'School Satchel'
      }, {
        code: '1f45e',
        desc: 'Mans Shoe'
      }, {
        code: '1f45f',
        desc: 'Athletic Shoe'
      }, {
        code: '1f460',
        desc: 'High-Heeled Shoe'
      }, {
        code: '1f461',
        desc: 'Womans Sandal'
      }, {
        code: '1f462',
        desc: 'Womans Boots'
      }, {
        code: '1f451',
        desc: 'Crown'
      }, {
        code: '1f452',
        desc: 'Womans Hat'
      }, {
        code: '1f462',
        desc: 'Top Hat'
      }, {
        code: '1f393',
        desc: 'Graduation Cap'
      }, {
        code: '1f484',
        desc: 'Lipstick'
      }, {
        code: '1f48d',
        desc: 'Ring'
      }, {
        code: '1f48e',
        desc: 'Gem Stone'
      }]
    }, {
      'id': 'nature',
      'name': 'Animals & Nature',
      'code': '1F435',
      'emoticons': [{
        code: '1F435',
        desc: 'Monkey Face'
      }, {
        code: '1F412',
        desc: 'Monkey'
      }, {
        code: '1F436',
        desc: 'Dog Face'
      }, {
        code: '1F415',
        desc: 'Dog'
      }, {
        code: '1F429',
        desc: 'Poodle'
      }, {
        code: '1F43A',
        desc: 'Wolf Face'
      }, {
        code: '1F431',
        desc: 'Cat Face'
      }, {
        code: '1F408',
        desc: 'Cat'
      }, {
        code: '1F42F',
        desc: 'Tiger Face'
      }, {
        code: '1F405',
        desc: 'Tiger'
      }, {
        code: '1F406',
        desc: 'Leopard'
      }, {
        code: '1F434',
        desc: 'Horse Face'
      }, {
        code: '1F40E',
        desc: 'Horse'
      }, {
        code: '1F42E',
        desc: 'Cow Face'
      }, {
        code: '1F402',
        desc: 'Ox'
      }, {
        code: '1F403',
        desc: 'Water Buffalo'
      }, {
        code: '1F404',
        desc: 'Cow'
      }, {
        code: '1F437',
        desc: 'Pig Face'
      }, {
        code: '1F416',
        desc: 'Pig'
      }, {
        code: '1F417',
        desc: 'Boar'
      }, {
        code: '1F43D',
        desc: 'Pig Nose'
      }, {
        code: '1F40F',
        desc: 'Ram'
      }, {
        code: '1F411',
        desc: 'Sheep'
      }, {
        code: '1F410',
        desc: 'Goat'
      }, {
        code: '1F42A',
        desc: 'Dromedary Camel'
      }, {
        code: '1F42B',
        desc: 'Bactrian Camel'
      }, {
        code: '1F418',
        desc: 'Elephant'
      }, {
        code: '1F42D',
        desc: 'Mouse Face'
      }, {
        code: '1F401',
        desc: 'Mouse'
      }, {
        code: '1F400',
        desc: 'Rat'
      }, {
        code: '1F439',
        desc: 'Hamster Face'
      }, {
        code: '1F430',
        desc: 'Rabbit Face'
      }, {
        code: '1F407',
        desc: 'Rabbit'
      }, {
        code: '1F43B',
        desc: 'Bear Face'
      }, {
        code: '1F428',
        desc: 'Koala'
      }, {
        code: '1F43C',
        desc: 'Panda Face'
      }, {
        code: '1F43E',
        desc: 'Paw Prints'
      }, {
        code: '1F414',
        desc: 'Chicken'
      }, {
        code: '1F413',
        desc: 'Rooster'
      }, {
        code: '1F423',
        desc: 'Hatching Chick'
      }, {
        code: '1F424',
        desc: 'Baby Chick'
      }, {
        code: '1F425',
        desc: 'Front-Facing Baby Chick'
      }, {
        code: '1F426',
        desc: 'Bird'
      }, {
        code: '1F427',
        desc: 'Penguin'
      }, {
        code: '1F438',
        desc: 'Frog Face'
      }, {
        code: '1F40A',
        desc: 'Crocodile'
      }, {
        code: '1F422',
        desc: 'Turtle'
      }, {
        code: '1F40D',
        desc: 'Snake'
      }, {
        code: '1F432',
        desc: 'Dragon Face'
      }, {
        code: '1F409',
        desc: 'Dragon'
      }, {
        code: '1F433',
        desc: 'Spouting Whale'
      }, {
        code: '1F40B',
        desc: 'Whale'
      }, {
        code: '1F42C',
        desc: 'Dolphin'
      }, {
        code: '1F41F',
        desc: 'Fish'
      }, {
        code: '1F420',
        desc: 'Tropical Fish'
      }, {
        code: '1F421',
        desc: 'Blowfish'
      }, {
        code: '1F419',
        desc: 'Octopus'
      }, {
        code: '1F41A',
        desc: 'Spiral Shell'
      }, {
        code: '1F40C',
        desc: 'Snail'
      }, {
        code: '1F41B',
        desc: 'Bug'
      }, {
        code: '1F41C',
        desc: 'Ant'
      }, {
        code: '1F41D',
        desc: 'Honeybee'
      }, {
        code: '1F41E',
        desc: 'Lady Beetle'
      }, {
        code: '1F490',
        desc: 'Bouquet'
      }, {
        code: '1F338',
        desc: 'Cherry Blossom'
      }, {
        code: '1F4AE',
        desc: 'White Flower'
      }, {
        code: '1F339',
        desc: 'Rose'
      }, {
        code: '1F33A',
        desc: 'Hibiscus'
      }, {
        code: '1F33B',
        desc: 'Sunflower'
      }, {
        code: '1F33C',
        desc: 'Blossom'
      }, {
        code: '1F337',
        desc: 'Tulip'
      }, {
        code: '1F331',
        desc: 'Seedling'
      }, {
        code: '1F332',
        desc: 'Evergreen Tree'
      }, {
        code: '1F333',
        desc: 'Deciduous Tree'
      }, {
        code: '1F334',
        desc: 'Palm Tree'
      }, {
        code: '1F335',
        desc: 'Cactus'
      }, {
        code: '1F33E',
        desc: 'Ear of Rice'
      }, {
        code: '1F33F',
        desc: 'Herb'
      }, {
        code: '2618',
        desc: 'Four Leaf Clover'
      }, {
        code: '1F341',
        desc: 'Maple Leaf'
      }, {
        code: '1F342',
        desc: 'Fallen Leaf'
      }, {
        code: '1F343',
        desc: 'Leaf Fluttering in Wind'
      }]
    }, {
      'id': 'foods',
      'name': 'Food & Drink',
      'code': '1F347',
      'emoticons': [{
        code: '1F347',
        desc: 'Grapes'
      }, {
        code: '1F348',
        desc: 'Melon'
      }, {
        code: '1F349',
        desc: 'Watermelon'
      }, {
        code: '1F34A',
        desc: 'Tangerine'
      }, {
        code: '1F34B',
        desc: 'Lemon'
      }, {
        code: '1F34C',
        desc: 'Banana'
      }, {
        code: '1F34D',
        desc: 'Pineapple'
      }, {
        code: '1F34E',
        desc: 'Red Apple'
      }, {
        code: '1F34F',
        desc: 'Green Apple'
      }, {
        code: '1F350',
        desc: 'Pear'
      }, {
        code: '1F351',
        desc: 'Peach'
      }, {
        code: '1F352',
        desc: 'Cherries'
      }, {
        code: '1F353',
        desc: 'Strawberry'
      }, {
        code: '1F345',
        desc: 'Tomato'
      }, {
        code: '1F346',
        desc: 'Aubergine'
      }, {
        code: '1F33D',
        desc: 'Ear of Maize'
      }, {
        code: '1F344',
        desc: 'Mushroom'
      }, {
        code: '1F330',
        desc: 'Chestnut'
      }, {
        code: '1F35E',
        desc: 'Bread'
      }, {
        code: '1F356',
        desc: 'Meat on Bone'
      }, {
        code: '1F357',
        desc: 'Poultry Leg'
      }, {
        code: '1F354',
        desc: 'Hamburger'
      }, {
        code: '1F35F',
        desc: 'French Fries'
      }, {
        code: '1F355',
        desc: 'Slice of Pizza'
      }, {
        code: '1F373',
        desc: 'Cooking'
      }, {
        code: '1F372',
        desc: 'Pot of Food'
      }, {
        code: '1F371',
        desc: 'Bento Box'
      }, {
        code: '1F358',
        desc: 'Rice Cracker'
      }, {
        code: '1F359',
        desc: 'Rice Ball'
      }, {
        code: '1F35A',
        desc: 'Cooked Rice'
      }, {
        code: '1F35B',
        desc: 'Curry and Rice'
      }, {
        code: '1F35C',
        desc: 'Steaming Bowl'
      }, {
        code: '1F35D',
        desc: 'Spaghetti'
      }, {
        code: '1F360',
        desc: 'Roasted Sweet Potato'
      }, {
        code: '1F362',
        desc: 'Oden'
      }, {
        code: '1F363',
        desc: 'Sushi'
      }, {
        code: '1F364',
        desc: 'Fried Shrimp'
      }, {
        code: '1F365',
        desc: 'Fish Cake with Swirl Design'
      }, {
        code: '1F361',
        desc: 'Dango'
      }, {
        code: '1F366',
        desc: 'Soft Ice Cream'
      }, {
        code: '1F367',
        desc: 'Shaved Ice'
      }, {
        code: '1F368',
        desc: 'Ice Cream'
      }, {
        code: '1F369',
        desc: 'Doughnut'
      }, {
        code: '1F36A',
        desc: 'Cookie'
      }, {
        code: '1F382',
        desc: 'Birthday Cake'
      }, {
        code: '1F370',
        desc: 'Shortcake'
      }, {
        code: '1F36B',
        desc: 'Chocolate Bar'
      }, {
        code: '1F36C',
        desc: 'Candy'
      }, {
        code: '1F36D',
        desc: 'Lollipop'
      }, {
        code: '1F36E',
        desc: 'Custard'
      }, {
        code: '1F36F',
        desc: 'Honey Pot'
      }, {
        code: '1F37C',
        desc: 'Baby Bottle'
      }, {
        code: '2615',
        desc: 'Hot Beverage'
      }, {
        code: '1F375',
        desc: 'Teacup Without Handle'
      }, {
        code: '1F376',
        desc: 'Sake Bottle and Cup'
      }, {
        code: '1F377',
        desc: 'Wine Glass'
      }, {
        code: '1F378',
        desc: 'Cocktail Glass'
      }, {
        code: '1F379',
        desc: 'Tropical Drink'
      }, {
        code: '1F37A',
        desc: 'Beer Mug'
      }, {
        code: '1F37B',
        desc: 'Clinking Beer Mugs'
      }, {
        code: '1F374',
        desc: 'Fork and Knife'
      }, {
        code: '1F52A',
        desc: 'Hocho'
      }]
    }, {
      'id': 'activity',
      'name': 'Activities',
      'code': '1f383',
      'emoticons': [{
        code: '1f383',
        desc: ' Jack-O-Lantern'
      }, {
        code: '1f384',
        desc: 'Christmas Tree'
      }, {
        code: '1f386',
        desc: ' Fireworks'
      }, {
        code: '1f387',
        desc: 'Firework Sparkler'
      }, {
        code: '2728',
        desc: ' Sparkles'
      }, {
        code: '1f388',
        desc: 'Balloon'
      }, {
        code: '1f389',
        desc: 'Party Popper'
      }, {
        code: '1f38a',
        desc: 'Confetti Ball'
      }, {
        code: '1f38b',
        desc: 'Tanabata Tree'
      }, {
        code: '1f38d',
        desc: 'Pine Decoration'
      }, {
        code: '1f38e',
        desc: 'Japanese Dolls'
      }, {
        code: '1f38f',
        desc: 'Carp Streamer'
      }, {
        code: '1f390',
        desc: 'Wind Chime'
      }, {
        code: '1f391',
        desc: 'Moon Viewing Ceremony'
      }, {
        code: '1f380',
        desc: 'Ribbon'
      }, {
        code: '1f381',
        desc: 'Wrapped Present'
      }, {
        code: '1f3ab',
        desc: 'Ticket'
      }, {
        code: '1f3c6',
        desc: 'Trophy'
      }, {
        code: '1f388',
        desc: 'Balloon'
      }, {
        code: '26bd',
        desc: 'Soccer Ball'
      }, {
        code: '26be',
        desc: 'Baseball'
      }, {
        code: '1f3c0',
        desc: 'Basketball and Hoop'
      }, {
        code: '1f3c8',
        desc: 'American Football'
      }, {
        code: '1f3c9',
        desc: 'Rugby Football'
      }, {
        code: '1f3be',
        desc: 'Tennis Racquet and Ball'
      }, {
        code: '1f3b1',
        desc: 'Billiards'
      }, {
        code: '1f3b3',
        desc: 'Bowling'
      }, {
        code: '1f3af',
        desc: 'Direct Hit'
      }, {
        code: '26f3',
        desc: 'Flag in Hole'
      }, {
        code: '1f3a3',
        desc: 'Fishing Pole and Fish'
      }, {
        code: '1f3bd',
        desc: 'Running Shirt with Sash'
      }, {
        code: '1f3bf',
        desc: 'Ski and Ski Boot'
      }, {
        code: '1f3ae',
        desc: 'Video Game'
      }, {
        code: '1f3b2',
        desc: 'Game Die'
      }, {
        code: '2660',
        desc: 'Black Spade Suit'
      }, {
        code: '2665',
        desc: 'Black Heart SuiT'
      }, {
        code: '2666',
        desc: 'Black Diamond Suit'
      }, {
        code: '2663',
        desc: 'Black Club Suit'
      }, {
        code: '1f0cf',
        desc: 'Playing Card Black Joker'
      }, {
        code: '1f004',
        desc: 'Mahjong Tile Red Dragon'
      }, {
        code: '1f3b4',
        desc: 'Flower Playing Cards'
      }]
    }, {
      'id': 'places',
      'name': 'Travel & Places',
      'code': '1f30d',
      'emoticons': [{
        code: '1f30d',
        desc: 'Earth Globe Europe-Africa'
      }, {
        code: '1f30e',
        desc: 'Earth Globe Americas'
      }, {
        code: '1f30f',
        desc: 'Earth Globe Asia-Australia'
      }, {
        code: '1f310',
        desc: 'Globe with Meridians'
      }, {
        code: '1f5fe',
        desc: 'Silhouette of Japan'
      }, {
        code: '1f30b',
        desc: 'Volcano'
      }, {
        code: '1f5fb',
        desc: 'Mount Fuji'
      }, {
        code: '1f3e0',
        desc: 'House Building'
      }, {
        code: '1f3e1',
        desc: 'House with Garden'
      }, {
        code: '1f3e2',
        desc: 'Office Building'
      }, {
        code: '1f3e3',
        desc: 'Japanese Post Office'
      }, {
        code: '1f3e4',
        desc: 'European Post Office'
      }, {
        code: '1f3e5',
        desc: 'Hospital'
      }, {
        code: '1f3e6',
        desc: 'Bank'
      }, {
        code: '1f3e8',
        desc: 'Hotel'
      }, {
        code: '1f3e9',
        desc: 'Love Hotel'
      }, {
        code: '1f3ea',
        desc: 'Convenience Store'
      }, {
        code: '1f3eb',
        desc: 'School'
      }, {
        code: '1f3ec',
        desc: 'Department Store'
      }, {
        code: '1f3ed',
        desc: 'Factory'
      }, {
        code: '1f3ef',
        desc: 'Japanese Castle'
      }, {
        code: '1f3f0',
        desc: 'European Castle'
      }, {
        code: '1f492',
        desc: 'Wedding'
      }, {
        code: '1f5fc',
        desc: 'Tokyo Tower'
      }, {
        code: '1f5fd',
        desc: 'Statue of Liberty'
      }, {
        code: '26ea',
        desc: 'Church'
      }, {
        code: '26f2',
        desc: 'Fountain'
      }, {
        code: '26fa',
        desc: 'Tent'
      }, {
        code: '1f301',
        desc: 'Foggy'
      }, {
        code: '1f303',
        desc: 'Night with Stars'
      }, {
        code: '1f304',
        desc: 'Sunrise over Mountains'
      }, {
        code: '1f305',
        desc: 'Sunrise'
      }, {
        code: '1f306',
        desc: 'Cityscape at Dusk'
      }, {
        code: '1f307',
        desc: 'Sunset over Buildings'
      }, {
        code: '1f309',
        desc: 'Bridge at Night'
      }, {
        code: '2668',
        desc: 'Hot Springs'
      }, {
        code: '1f30c',
        desc: 'Milky Way'
      }, {
        code: '1f3a0',
        desc: 'Carousel Horse'
      }, {
        code: '1f3a1',
        desc: 'Ferris Wheel'
      }, {
        code: '1f3a2',
        desc: 'Roller Coaster'
      }, {
        code: '1f488',
        desc: 'Barber Pole'
      }, {
        code: '1f3aa',
        desc: 'Circus Tent'
      }, {
        code: '1f3ad',
        desc: 'Performing Arts'
      }, {
        code: '1f3a8',
        desc: 'Artist Palette'
      }, {
        code: '1f3b0',
        desc: 'Slot Machine'
      }, {
        code: '1f682',
        desc: 'Steam Locomotive'
      }, {
        code: '1f683',
        desc: 'Railway Car'
      }, {
        code: '1f684',
        desc: 'High-Speed Train'
      }, {
        code: '1f685',
        desc: 'High-Speed Train with Bullet Nose'
      }, {
        code: '1f686',
        desc: 'Train'
      }, {
        code: '1f687',
        desc: 'Metro'
      }, {
        code: '1f688',
        desc: 'Light Rail'
      }, {
        code: '1f689',
        desc: 'Station'
      }, {
        code: '1f68a',
        desc: 'Tram'
      }, {
        code: '1f69d',
        desc: 'Monorail'
      }, {
        code: '1f69e',
        desc: 'Mountain Railway'
      }, {
        code: '1f68b',
        desc: 'Tram Car'
      }, {
        code: '1f68c',
        desc: 'Bus'
      }, {
        code: '1f68d',
        desc: 'Oncoming Bus'
      }, {
        code: '1f68e',
        desc: 'Trolleybus'
      }, {
        code: '1f690',
        desc: 'Minibus'
      }, {
        code: '1f691',
        desc: 'Ambulance'
      }, {
        code: '1f692',
        desc: 'Fire Engine'
      }, {
        code: '1f693',
        desc: 'Police Car'
      }, {
        code: '1f694',
        desc: 'Oncoming Police Car'
      }, {
        code: '1f695',
        desc: 'Taxi'
      }, {
        code: '1f695',
        desc: 'Oncoming Taxi'
      }, {
        code: '1f697',
        desc: 'Automobile'
      }, {
        code: '1f698',
        desc: 'Oncoming Automobile'
      }, {
        code: '1f699',
        desc: 'Recreational Vehicle'
      }, {
        code: '1f69a',
        desc: 'Delivery Truck'
      }, {
        code: '1f69b',
        desc: 'Articulated Lorry'
      }, {
        code: '1f69c',
        desc: 'Tractor'
      }, {
        code: '1f6b2',
        desc: 'Bicycle'
      }, {
        code: '1f68f',
        desc: 'Bus Stop'
      }, {
        code: '26fd',
        desc: 'Fuel Pump'
      }, {
        code: '1f6a8',
        desc: 'Police Cars Revolving Light'
      }, {
        code: '1f6a5',
        desc: 'Horizontal Traffic Light'
      }, {
        code: '1f6a6',
        desc: 'Vertical Traffic Light'
      }, {
        code: '1f6a7',
        desc: 'Construction Sign'
      }, {
        code: '2693',
        desc: 'Anchor'
      }, {
        code: '26f5',
        desc: 'Sailboat'
      }, {
        code: '1f6a4',
        desc: 'Speedboat'
      }, {
        code: '1f6a2',
        desc: 'Ship'
      }, {
        code: '2708',
        desc: 'Airplane'
      }, {
        code: '1f4ba',
        desc: 'Seat'
      }, {
        code: '1f681',
        desc: 'Helicopter'
      }, {
        code: '1f69f',
        desc: 'Suspension Railway'
      }, {
        code: '1f6a0',
        desc: 'Mountain Cableway'
      }, {
        code: '1f6a1',
        desc: 'Aerial Tramway'
      }, {
        code: '1f680',
        desc: 'Rocket'
      }, {
        code: '1f6aa',
        desc: 'Door'
      }, {
        code: '1f6bd',
        desc: 'Toilet'
      }, {
        code: '1f6bf',
        desc: 'Shower'
      }, {
        code: '1f6c1',
        desc: 'Bathtub'
      }, {
        code: '231b',
        desc: 'Hourglass'
      }, {
        code: '23f3',
        desc: 'Hourglass with Flowing Sand'
      }, {
        code: '231a',
        desc: 'Watch'
      }, {
        code: '23f0',
        desc: 'Alarm Clock'
      }, {
        code: '1f55b',
        desc: 'Clock Face Twelve Oclock'
      }, {
        code: '1f567',
        desc: 'Clock Face Twelve-Thirty'
      }, {
        code: '1f550',
        desc: 'Clock Face One Oclock'
      }, {
        code: '1f55c',
        desc: 'Clock Face One-thirty'
      }, {
        code: '1f551',
        desc: 'Clock Face Two Oclock'
      }, {
        code: '1f55d',
        desc: 'Clock Face Two-thirty'
      }, {
        code: '1f552',
        desc: 'Clock Face Three Oclock'
      }, {
        code: '1f55e',
        desc: 'Clock Face Three-thirty'
      }, {
        code: '1f553',
        desc: 'Clock Face Four Oclock'
      }, {
        code: '1f55f',
        desc: 'Clock Face Four-thirty'
      }, {
        code: '1f554',
        desc: 'Clock Face Five Oclock'
      }, {
        code: '1f560',
        desc: 'Clock Face Five-thirty'
      }, {
        code: '1f555',
        desc: 'Clock Face Six Oclock'
      }, {
        code: '1f561',
        desc: 'Clock Face Six-thirty'
      }, {
        code: '1f556',
        desc: 'Clock Face Seven Oclock'
      }, {
        code: '1f562',
        desc: 'Clock Face Seven-thirty'
      }, {
        code: '1f557',
        desc: 'Clock Face Eight Oclock'
      }, {
        code: '1f563',
        desc: 'Clock Face Eight-thirty'
      }, {
        code: '1f558',
        desc: 'Clock Face Nine Oclock'
      }, {
        code: '1f564',
        desc: 'Clock Face Nine-thirty'
      }, {
        code: '1f559',
        desc: 'Clock Face Ten Oclock'
      }, {
        code: '1f565',
        desc: 'Clock Face Ten-thirty'
      }, {
        code: '1f55a',
        desc: 'Clock Face Eleven Oclock'
      }, {
        code: '1f566',
        desc: 'Clock Face Eleven-thirty'
      }, {
        code: '1f311',
        desc: 'New Moon Symbol'
      }, {
        code: '1f312',
        desc: 'Waxing Crescent Moon Symbol'
      }, {
        code: '1f313',
        desc: 'First Quarter Moon Symbol'
      }, {
        code: '1f314',
        desc: 'Waxing Gibbous Moon Symbol'
      }, {
        code: '1f315',
        desc: 'Full Moon Symbol'
      }, {
        code: '1f316',
        desc: 'Waning Gibbous Moon Symbol'
      }, {
        code: '1f317',
        desc: 'Last Quarter Moon Symbol'
      }, {
        code: '1f318',
        desc: 'Waning Crescent Moon Symbol'
      }, {
        code: '1f319',
        desc: 'Crescent Moon'
      }, {
        code: '1f31a',
        desc: 'New Moon with Face'
      }, {
        code: '1f31b',
        desc: 'First Quarter Moon with Face'
      }, {
        code: '1f31c',
        desc: 'Last Quarter Moon with Face'
      }, {
        code: '2600',
        desc: 'Black Sun with Rays'
      }, {
        code: '1f31d',
        desc: 'Full Moon with Face'
      }, {
        code: '1f31e',
        desc: 'Sun with Face'
      }, {
        code: '2b50',
        desc: 'White Medium Star'
      }, {
        code: '1f31f',
        desc: 'Glowing Star'
      }, {
        code: '1f320',
        desc: 'Shooting Star'
      }, {
        code: '2601',
        desc: 'Cloud'
      }, {
        code: '26c5',
        desc: 'Sun Behind Cloud'
      }, {
        code: '1f300',
        desc: 'Cyclone'
      }, {
        code: '1f308',
        desc: 'Rainbow'
      }, {
        code: '1f302',
        desc: 'Closed Umbrella'
      }, {
        code: '2614',
        desc: 'Umbrella with Rain Drops'
      }, {
        code: '26a1',
        desc: 'High Voltage Sign'
      }, {
        code: '2744',
        desc: 'Snowflake'
      }, {
        code: '2603',
        desc: 'Snowman Without Snow'
      }, {
        code: '1f525',
        desc: 'Fire'
      }, {
        code: '1f4a7',
        desc: 'Droplet'
      }, {
        code: '1F30A',
        desc: 'Water Wave'
      }]
    }, {
      'id': 'objects',
      'name': 'Objects',
      'code': '1F507',
      'emoticons': [{
        code: '1F507',
        desc: 'Speaker with Cancellation Stroke'
      }, {
        code: '1F508',
        desc: 'Speaker'
      }, {
        code: '1F509',
        desc: 'Speaker with One Sound Wave'
      }, {
        code: '1F50A',
        desc: 'Speaker with Three Sound Wave'
      }, {
        code: '1F4E2',
        desc: 'Public Address Loudspeaker'
      }, {
        code: '1F4E3',
        desc: 'Cheering Megaphone'
      }, {
        code: '1F4EF',
        desc: 'Postal Horn'
      }, {
        code: '1F514',
        desc: 'Bell'
      }, {
        code: '1F515',
        desc: 'Bell with Cancellation Stroke'
      }, {
        code: '1F3BC',
        desc: 'Musical Score'
      }, {
        code: '1F3B5',
        desc: 'Musical Note'
      }, {
        code: '1F3B6',
        desc: 'Multiple Musical Notes'
      }, {
        code: '1F3A4',
        desc: 'Microphone'
      }, {
        code: '1F3A7',
        desc: 'Headphone'
      }, {
        code: '1F4FB',
        desc: 'Radio'
      }, {
        code: '1F3B7',
        desc: 'Saxophone'
      }, {
        code: '1F3B8',
        desc: 'Guitar'
      }, {
        code: '1F3B9',
        desc: 'Musical Keyboard'
      }, {
        code: '1F3BA',
        desc: 'Trumpet'
      }, {
        code: '1F3BB',
        desc: 'Violin'
      }, {
        code: '1F4F1',
        desc: 'Mobile Phone'
      }, {
        code: '1F4F2',
        desc: 'Mobile Phone with Rightwards Arrow at Left'
      }, {
        code: '260E',
        desc: 'Black Telephone'
      }, {
        code: '1F4DE',
        desc: 'Telephone Receiver'
      }, {
        code: '1F4DF',
        desc: 'Pager'
      }, {
        code: '1F4E0',
        desc: 'Fax Machine'
      }, {
        code: '1F50B',
        desc: 'Battery'
      }, {
        code: '1F50C',
        desc: 'Electric Plug'
      }, {
        code: '1F4BB',
        desc: 'Personal Computer'
      }, {
        code: '1F4BD',
        desc: 'Minidisc'
      }, {
        code: '1F4BE',
        desc: 'Floppy Disk'
      }, {
        code: '1F4BF',
        desc: 'Optical Disk'
      }, {
        code: '1F4C0',
        desc: 'Dvd'
      }, {
        code: '1F3A5',
        desc: 'Movie Camera'
      }, {
        code: '1F3AC',
        desc: 'Clapper Board'
      }, {
        code: '1F4FA',
        desc: 'Television'
      }, {
        code: '1F4F7',
        desc: 'Camera'
      }, {
        code: '1F4F9',
        desc: 'Video Camera'
      }, {
        code: '1F4FC',
        desc: 'Videocassette'
      }, {
        code: '1F50D',
        desc: 'Left-Pointing Magnifying Glass'
      }, {
        code: '1F50E',
        desc: 'Right-Pointing Magnifying Glass'
      }, {
        code: '1F52C',
        desc: 'Microscope'
      }, {
        code: '1F52D',
        desc: 'Telelscope'
      }, {
        code: '1F4E1',
        desc: 'Satellite Antenna'
      }, {
        code: '1F4A1',
        desc: 'Electric Light Bulb'
      }, {
        code: '1F526',
        desc: 'Electric Torch'
      }, {
        code: '1F3EE',
        desc: 'Izakaya Lantern'
      }, {
        code: '1F4D4',
        desc: 'Notebook with Decorative Cover'
      }, {
        code: '1F4D5',
        desc: 'Closed Book'
      }, {
        code: '1F4D6',
        desc: 'Open Book'
      }, {
        code: '1F4D7',
        desc: 'Green Book'
      }, {
        code: '1F4D8',
        desc: 'Blue Book'
      }, {
        code: '1F4D9',
        desc: 'Orange Book'
      }, {
        code: '1F4DA',
        desc: 'Books'
      }, {
        code: '1F4D3',
        desc: 'Notebook'
      }, {
        code: '1F4D2',
        desc: 'Ledger'
      }, {
        code: '1F4C3',
        desc: 'Curl'
      }, {
        code: '1F4DC',
        desc: 'Scroll'
      }, {
        code: '1F4C4',
        desc: 'Page Facing Up'
      }, {
        code: '1F4F0',
        desc: 'Newspaper'
      }, {
        code: '1F4D1',
        desc: 'Bookmark Tabs'
      }, {
        code: '1F516',
        desc: 'Bookmark'
      }, {
        code: '1F4B0',
        desc: 'Money Bag'
      }, {
        code: '1F4B4',
        desc: 'Banknote with Yen Sign'
      }, {
        code: '1F4B5',
        desc: 'Banknote with Dollar Sign'
      }, {
        code: '1F4B6',
        desc: 'Banknote with Euro Sign'
      }, {
        code: '1F4B7',
        desc: 'Banknote with Pound Sign'
      }, {
        code: '1F4B8',
        desc: 'Money with Wings'
      }, {
        code: '1F4B3',
        desc: 'Credit Card'
      }, {
        code: '1F4B9',
        desc: 'Chart with Upwards Trend and Yen Sign'
      }, {
        code: '1F4B1',
        desc: 'Currency Exchange'
      }, {
        code: '1F4B2',
        desc: 'Heavy Dollar Sign'
      }, {
        code: '2709',
        desc: 'Envelope'
      }, {
        code: '1F4E7',
        desc: 'E-Mail Symbol'
      }, {
        code: '1F4E8',
        desc: 'Incoming Envelope'
      }, {
        code: '1F4E9',
        desc: 'Envelope with Downwards Arrow Above'
      }, {
        code: '1F4E4',
        desc: 'Outbox Tray'
      }, {
        code: '1F4E5',
        desc: 'Inbox Tray'
      }, {
        code: '1F4E6',
        desc: 'Package'
      }, {
        code: '1F4BE',
        desc: 'Closed Mailbox with Raised Flag'
      }, {
        code: '1F4EA',
        desc: 'Closed Mailbox with Lowered Flag'
      }, {
        code: '1F4EC',
        desc: 'Open Mailbox with Raised Flag'
      }, {
        code: '1F4ED',
        desc: 'Open Mailbox with Lowered Flag'
      }, {
        code: '1F5F3',
        desc: 'Postbox'
      }, {
        code: '270F',
        desc: 'Pencil'
      }, {
        code: '2712',
        desc: 'Black Nib'
      }, {
        code: '1F4DD',
        desc: 'Memo'
      }, {
        code: '1F4BC',
        desc: 'Briefcase'
      }, {
        code: '1F4C1',
        desc: 'File Folder'
      }, {
        code: '1F4C2',
        desc: 'Open File Folder'
      }, {
        code: '1F4C5',
        desc: 'Calender'
      }, {
        code: '1F4C6',
        desc: 'Tear-off Calender'
      }, {
        code: '1F4C7',
        desc: 'Card Index'
      }, {
        code: '1F4C8',
        desc: 'Chart with Upwards Trend'
      }, {
        code: '1F4C9',
        desc: 'Chart with Downwards Trend'
      }, {
        code: '1F4CA',
        desc: 'Bar Chart'
      }, {
        code: '1F4CB',
        desc: 'Clipboard'
      }, {
        code: '1F4CC',
        desc: 'Pushpin'
      }, {
        code: '1F4CD',
        desc: 'Round Pushpin'
      }, {
        code: '1F4CE',
        desc: 'Paperclip'
      }, {
        code: '1F4CF',
        desc: 'Straight Ruler'
      }, {
        code: '1F4D0',
        desc: 'Triangular Ruler'
      }, {
        code: '2702',
        desc: 'Black Scissors'
      }, {
        code: '1F512',
        desc: 'Lock'
      }, {
        code: '1F513',
        desc: 'Open Lock'
      }, {
        code: '1F50F',
        desc: 'Lock with Ink Pen'
      }, {
        code: '1F510',
        desc: 'Closed Lock with Key'
      }, {
        code: '1F511',
        desc: 'Key'
      }, {
        code: '1F528',
        desc: 'Hammer'
      }, {
        code: '1F52B',
        desc: 'Pistol'
      }, {
        code: '1F527',
        desc: 'Wrench'
      }, {
        code: '1F529',
        desc: 'Nut and Bolt'
      }, {
        code: '1F517',
        desc: 'Link Symbol'
      }, {
        code: '1F489',
        desc: 'Syringe'
      }, {
        code: '1F48A',
        desc: 'Pill'
      }, {
        code: '1F6AC',
        desc: 'Smoking Symbol'
      }, {
        code: '1F5FF',
        desc: 'Moyai'
      }, {
        code: '1F52E',
        desc: 'Crystal Ball'
      }]
    }, {
      'id': 'symbols',
      'name': 'Symbols',
      'code': '1F3E7',
      'emoticons': [{
        code: '1F3E7',
        desc: 'Automated Teller Machine'
      }, {
        code: '1F6AE',
        desc: 'Put Litter in Its Place Symbol'
      }, {
        code: '1F6B0',
        desc: 'Potable Water Symbol'
      }, {
        code: '267F',
        desc: 'Wheelchair Symbol'
      }, {
        code: '1F6B9',
        desc: 'Mens Symbol'
      }, {
        code: '1F6BA',
        desc: 'Womens Symbol'
      }, {
        code: '1F6BB',
        desc: 'Restroom'
      }, {
        code: '1F6BC',
        desc: 'Baby Symbol'
      }, {
        code: '1F6BE',
        desc: 'Water Closet'
      }, {
        code: '1F6C2',
        desc: 'Passport Control'
      }, {
        code: '1F6C3',
        desc: 'Customs'
      }, {
        code: '1F6C4',
        desc: 'Baggage Claim'
      }, {
        code: '1F6C5',
        desc: 'Left Luggage'
      }, {
        code: '26A0',
        desc: 'Warning Sign'
      }, {
        code: '1F6B8',
        desc: 'Children Crossing'
      }, {
        code: '26D4',
        desc: 'No Entry'
      }, {
        code: '1F6AB',
        desc: 'No Entry Sign'
      }, {
        code: '1F6B3',
        desc: 'No Bicycles'
      }, {
        code: '1F6AD',
        desc: 'No Smoking Symbol'
      }, {
        code: '1F6AF',
        desc: 'Do Not Litter Symbol'
      }, {
        code: '1F6B1',
        desc: 'Non-Potable Water Symbol'
      }, {
        code: '1F6B7',
        desc: 'No Pedestrians'
      }, {
        code: '1F4F5',
        desc: 'No Mobile Phones'
      }, {
        code: '1F51E',
        desc: 'No One Under Eighteen Symbol'
      }, {
        code: '2B06',
        desc: 'Upwards Black Arrow'
      }, {
        code: '2197',
        desc: 'North East Arrow'
      }, {
        code: '27A1',
        desc: 'Black Rightwards Arrow'
      }, {
        code: '2198',
        desc: 'South East Arrow'
      }, {
        code: '2B07',
        desc: 'Downwards Black Arrow'
      }, {
        code: '2199',
        desc: 'South West Arrow'
      }, {
        code: '2B05',
        desc: 'Leftwards Black Arrow'
      }, {
        code: '2196',
        desc: 'North West Arrow'
      }, {
        code: '2195',
        desc: 'Up Down Arrow'
      }, {
        code: '2194',
        desc: 'Left Right Arrow'
      }, {
        code: '21A9',
        desc: 'Leftwards Arrow with Hook'
      }, {
        code: '21AA',
        desc: 'Rightwards Arrow with Hook'
      }, {
        code: '2934',
        desc: 'Arrow Pointing Rightwards Then Curving Upwards'
      }, {
        code: '2935',
        desc: 'Arrow Pointing Rightwards Then Curving Downwards'
      }, {
        code: '1F503',
        desc: 'Clockwise Downwards and Upwards Open Circle Arrows'
      }, {
        code: '1F504',
        desc: 'Anticlockwise Downwards and Upwards Open Circle Arrows'
      }, {
        code: '1F519',
        desc: 'Back with Leftwards Arrow Above'
      }, {
        code: '1F51A',
        desc: 'End with Leftwards Arrow Above'
      }, {
        code: '1F51B',
        desc: 'On with Exclamation Mark with Left Right Arrow Above'
      }, {
        code: '1F51C',
        desc: 'Soon with Rightwards Arrow Above'
      }, {
        code: '1F51D',
        desc: 'Top with Upwards Arrow Above'
      }, {
        code: '1F52F',
        desc: 'Six Pointed Star with Middle Dot'
      }, {
        code: '2648',
        desc: 'Aries'
      }, {
        code: '2649',
        desc: 'Taurus'
      }, {
        code: '264A',
        desc: 'Gemini'
      }, {
        code: '264B',
        desc: 'Cancer'
      }, {
        code: '264C',
        desc: 'Leo'
      }, {
        code: '264D',
        desc: 'Virgo'
      }, {
        code: '264E',
        desc: 'Libra'
      }, {
        code: '264F',
        desc: 'Scorpius'
      }, {
        code: '2650',
        desc: 'Sagittarius'
      }, {
        code: '2651',
        desc: 'Capricorn'
      }, {
        code: '2652',
        desc: 'Aquarius'
      }, {
        code: '2653',
        desc: 'Pisces'
      }, {
        code: '26CE',
        desc: 'Ophiuchus'
      }, {
        code: '1F500',
        desc: 'Twisted Rightwards Arrows'
      }, {
        code: '1F501',
        desc: 'Clockwise Rightwards and Leftwards Open Circle Arrows'
      }, {
        code: '1F502',
        desc: 'Clockwise Rightwards and Leftwards Open Circle Arrows with Circled One Overlay'
      }, {
        code: '25B6',
        desc: 'Black Right-Pointing Triangle'
      }, {
        code: '23E9',
        desc: 'Black Right-Pointing Double Triangle'
      }, {
        code: '25C0',
        desc: 'Black Left-Pointing Triangle'
      }, {
        code: '23EA',
        desc: 'Black Left-Pointing Double Triangle'
      }, {
        code: '1F53C',
        desc: 'Up-Pointing Small Red Triangle'
      }, {
        code: '23EB',
        desc: 'Black Up-Pointing Double Triangle'
      }, {
        code: '1F53D',
        desc: 'Down-Pointing Small Red Triangle'
      }, {
        code: '23EC',
        desc: 'Black Down-Pointing Double Triangle'
      }, {
        code: '1F3A6',
        desc: 'Cinema'
      }, {
        code: '1F505',
        desc: 'Low Brightness Symbol'
      }, {
        code: '1F506',
        desc: 'High Brightness Symbol'
      }, {
        code: '1F4F6',
        desc: 'Antenna with Bars'
      }, {
        code: '1F4F3',
        desc: 'Vibration Mode'
      }, {
        code: '1F4F4',
        desc: 'Mobile Phone off'
      }, {
        code: '267B',
        desc: 'Black Universal Recycling Symbol'
      }, {
        code: '1F531',
        desc: 'Trident Emblem'
      }, {
        code: '1F4DB',
        desc: 'Name Badge'
      }, {
        code: '1F530',
        desc: 'Japanese Symbol for Beginner'
      }, {
        code: '2B55',
        desc: 'Heavy Large Circle'
      }, {
        code: '2705',
        desc: 'White Heavy Check Mark'
      }, {
        code: '2611',
        desc: 'Ballot Box with Check'
      }, {
        code: '2714',
        desc: 'Heavy Check Mark'
      }, {
        code: '2716',
        desc: 'Heavy Multiplication X'
      }, {
        code: '274C',
        desc: 'Cross Mark'
      }, {
        code: '274E',
        desc: 'Negative Squared Cross Mark'
      }, {
        code: '2795',
        desc: 'Heavy Plus Sign'
      }, {
        code: '2796',
        desc: 'Heavy Minus Sign'
      }, {
        code: '2797',
        desc: 'Heavy Division Sign'
      }, {
        code: '27B0',
        desc: 'Curly Loop'
      }, {
        code: '27BF',
        desc: 'Double Curly Loop'
      }, {
        code: '303D',
        desc: 'Part Alternation Mark'
      }, {
        code: '2733',
        desc: 'Eight Spoked Asterisk'
      }, {
        code: '2734',
        desc: 'Eight Pointed Black Star'
      }, {
        code: '2747',
        desc: 'Sparkle'
      }, {
        code: '203C',
        desc: 'Double Exclamation Mark'
      }, {
        code: '2049',
        desc: 'Exclamation Question Mark'
      }, {
        code: '2753',
        desc: 'Black Question Mark Ornament'
      }, {
        code: '2754',
        desc: 'White Question Mark Ornament'
      }, {
        code: '2755',
        desc: 'White Exclamation Mark Ornament'
      }, {
        code: '2757',
        desc: 'Heavy Exclamation Mark Symbol'
      }, {
        code: '3030',
        desc: 'Wavy Dash'
      }, {
        code: '2122',
        desc: 'Trade Mark Sign'
      }, {
        code: '1F51F',
        desc: 'Keycap Ten'
      }, {
        code: '1F4AF',
        desc: 'Hundred Points Symbol'
      }, {
        code: '1F520',
        desc: 'Input Symbol for Latin Capital Letters'
      }, {
        code: '1F521',
        desc: 'Input Symbol for Latin Small Letters'
      }, {
        code: '1F522',
        desc: 'Input Symbol for Numbers'
      }, {
        code: '1F523',
        desc: 'Input Symbol for Symbols'
      }, {
        code: '1F524',
        desc: 'Input Symbol for Latin Letters'
      }, {
        code: '1F170',
        desc: 'Negative Squared Latin Capital Letter a'
      }, {
        code: '1F18E',
        desc: 'Negative Squared Ab'
      }, {
        code: '1F171',
        desc: 'Negative Squared Latin Capital Letter B'
      }, {
        code: '1F191',
        desc: 'Squared Cl'
      }, {
        code: '1F192',
        desc: 'Squared Cool'
      }, {
        code: '1F193',
        desc: 'Squared Free'
      }, {
        code: '2139',
        desc: 'Information Source'
      }, {
        code: '1F194',
        desc: 'Squared Id'
      }, {
        code: '24C2',
        desc: 'Circled Latin Capital Letter M'
      }, {
        code: '1F195',
        desc: 'Squared New'
      }, {
        code: '1F196',
        desc: 'Squared Ng'
      }, {
        code: '1F17E',
        desc: 'Negative Squared Latin Capital Letter O'
      }, {
        code: '1F197',
        desc: 'Squared Ok'
      }, {
        code: '1F17F',
        desc: 'Negative Squared Latin Capital Letter P'
      }, {
        code: '1F198',
        desc: 'Squared Sos'
      }, {
        code: '1F199',
        desc: 'Squared Up with Exclamation Mark'
      }, {
        code: '1F19A',
        desc: 'Squared Vs'
      }, {
        code: '1F201',
        desc: 'Squared Katakana Koko'
      }, {
        code: '1F202',
        desc: 'Squared Katakana Sa'
      }, {
        code: '1F237',
        desc: 'Squared Cjk Unified Ideograph-6708'
      }, {
        code: '1F236',
        desc: 'Squared Cjk Unified Ideograph-6709'
      }, {
        code: '1F22F',
        desc: 'Squared Cjk Unified Ideograph-6307'
      }, {
        code: '1F250',
        desc: 'Circled Ideograph Advantage'
      }, {
        code: '1F239',
        desc: 'Squared Cjk Unified Ideograph-5272'
      }, {
        code: '1F21A',
        desc: 'Squared Cjk Unified Ideograph-7121'
      }, {
        code: '1F232',
        desc: 'Squared Cjk Unified Ideograph-7981'
      }, {
        code: '1F251',
        desc: 'Circled Ideograph Accept'
      }, {
        code: '1F238',
        desc: 'Squared Cjk Unified Ideograph-7533'
      }, {
        code: '1F234',
        desc: 'Squared Cjk Unified Ideograph-5408'
      }, {
        code: '1F233',
        desc: 'Squared Cjk Unified Ideograph-7a7a'
      }, {
        code: '3297',
        desc: 'Circled Ideograph Congratulation'
      }, {
        code: '3299',
        desc: 'Circled Ideograph Secret'
      }, {
        code: '1F23A',
        desc: 'Squared Cjk Unified Ideograph-55b6'
      }, {
        code: '1F235',
        desc: 'Squared Cjk Unified Ideograph-6e80'
      }, {
        code: '25AA',
        desc: 'Black Small Square'
      }, {
        code: '25AB',
        desc: 'White Small Square'
      }, {
        code: '25FB',
        desc: 'White Medium Square'
      }, {
        code: '25FC',
        desc: 'Black Medium Square'
      }, {
        code: '25FD',
        desc: 'White Medium Small Square'
      }, {
        code: '25FE',
        desc: 'Black Medium Small Square'
      }, {
        code: '2B1B',
        desc: 'Black Large Square'
      }, {
        code: '2B1C',
        desc: 'White Large Square'
      }, {
        code: '1F536',
        desc: 'Large Orange Diamond'
      }, {
        code: '1F537',
        desc: 'Large Blue Diamond'
      }, {
        code: '1F538',
        desc: 'Small Orange Diamond'
      }, {
        code: '1F539',
        desc: 'Small Blue Diamond'
      }, {
        code: '1F53A',
        desc: 'Up-Pointing Red Triangle'
      }, {
        code: '1F53B',
        desc: 'Down-Pointing Red Triangle'
      }, {
        code: '1F4A0',
        desc: 'Diamond Shape with a Dot Inside'
      }, {
        code: '1F518',
        desc: 'Radio Button'
      }, {
        code: '1F532',
        desc: 'Black Square Button'
      }, {
        code: '1F533',
        desc: 'White Square Button'
      }, {
        code: '26AA',
        desc: 'Medium White Circle'
      }, {
        code: '26AB',
        desc: 'Medium Black Circle'
      }, {
        code: '1F534',
        desc: 'Large Red Circle'
      }, {
        code: '1F535',
        desc: 'Large Blue Circle'
      }]
    }, {
      'id': 'flags',
      'name': 'Flags',
      'code': '1F3C1',
      'emoticons': [{
        code: '1f3c1',
        desc: 'Chequered Flag'
      }, {
        code: '1f1e8-1f1f3',
        desc: 'China Flag'
      }, {
        code: '1f38c',
        desc: 'Crossed Flags'
      }, {
        code: '1f1e9-1f1ea',
        desc: 'Germany Flag'
      }, {
        code: '1f1ea-1f1f8',
        desc: 'Spain Flag'
      }, {
        code: '1f1e6-1f1e8',
        desc: 'Ascension Island Flag'
      }, {
        code: '1f1e6-1f1e9',
        desc: 'Andorra Flag'
      }, {
        code: '1f1e6-1f1ea',
        desc: 'United Arab Emirates Flag'
      }, {
        code: '1f1e6-1f1eb',
        desc: 'Afghanistan Flag'
      }, {
        code: '1f1e6-1f1ec',
        desc: 'Antigua & Barbuda Flag'
      }, {
        code: '1f1e6-1f1ee',
        desc: 'Anguilla Flag'
      }, {
        code: '1f1e6-1f1f1',
        desc: 'Albania Flag'
      }, {
        code: '1f1e6-1f1f2',
        desc: 'Armenia Flag'
      }, {
        code: '1f1e6-1f1f4',
        desc: 'Angola Flag'
      }, {
        code: '1f1e6-1f1f6',
        desc: 'Antarctica Flag'
      }, {
        code: '1f1e6-1f1f7',
        desc: 'Argentina Flag'
      }, {
        code: '1f1e6-1f1f8',
        desc: 'American Samoa Flag'
      }, {
        code: '1f1e6-1f1f9',
        desc: 'Austria Flag'
      }, {
        code: '1f1e6-1f1fa',
        desc: 'Australia Flag'
      }, {
        code: '1f1e6-1f1fc',
        desc: 'Aruba Flag'
      }, {
        code: '1f1e6-1f1fd',
        desc: 'Åland Islands Flag'
      }, {
        code: '1f1e6-1f1ff',
        desc: 'Azerbaijan Flag'
      }, {
        code: '1f1e7-1f1e7',
        desc: 'Barbados Flag'
      }, {
        code: '1f1e7-1f1e9',
        desc: 'Bangladesh Flag'
      }, {
        code: '1f1e7-1f1ea',
        desc: 'Belgium Flag'
      }, {
        code: '1f1e7-1f1eb',
        desc: 'Burkina Faso Flag'
      }, {
        code: '1f1e7-1f1ec',
        desc: 'Bulgaria Flag'
      }, {
        code: '1f1e7-1f1ed',
        desc: 'Bahrain Flag'
      }, {
        code: '1f1e7-1f1ee',
        desc: 'Burundi Flag'
      }, {
        code: '1f1e7-1f1ef',
        desc: 'Benin Flag'
      }, {
        code: '1f1e7-1f1f1',
        desc: 'St. Barthélemy Flag'
      }, {
        code: '1f1e7-1f1f2',
        desc: 'Bermuda Flag'
      }, {
        code: '1f1e7-1f1f4',
        desc: 'Bolivia Flag'
      }, {
        code: '1f1e7-1f1f6',
        desc: 'Caribbean Netherlands Flag'
      }, {
        code: '1f1e7-1f1f7',
        desc: 'Brazil Flag'
      }, {
        code: '1f1e7-1f1f8',
        desc: 'Bahamas Flag'
      }, {
        code: '1f1e7-1f1f9',
        desc: 'Bhutan Flag'
      }, {
        code: '1f1e7-1f1fb',
        desc: 'Bouvet Island Flag'
      }, {
        code: '1f1e7-1f1fc',
        desc: 'Botswana Flag'
      }, {
        code: '1f1e7-1f1fe',
        desc: 'Belarus Flag'
      }, {
        code: '1f1e7-1f1ff',
        desc: 'Belize Flag'
      }, {
        code: '1f1e8-1f1e6',
        desc: 'Canada Flag'
      }, {
        code: '1f1e8-1f1e8',
        desc: 'Cocos (keeling) Islands Flag'
      }, {
        code: '1f1e8-1f1e9',
        desc: 'Congo - Kinshasa Flag'
      }, {
        code: '1f1e8-1f1eb',
        desc: 'Central African Republic Flag'
      }, {
        code: '1f1e8-1f1ec',
        desc: 'Congo - Brazzaville Flag'
      }, {
        code: '1f1e8-1f1ed',
        desc: 'Switzerland Flag'
      }, {
        code: '1f1e8-1f1ee',
        desc: 'Côte D’ivoire Flag'
      }, {
        code: '1f1e8-1f1f0',
        desc: 'Cook Islands Flag'
      }, {
        code: '1f1e8-1f1f1',
        desc: 'Chile Flag'
      }, {
        code: '1f1e8-1f1f2',
        desc: 'Cameroon Flag'
      }, {
        code: '1f1e8-1f1f4',
        desc: 'Colombia Flag'
      }, {
        code: '1f1e8-1f1f7',
        desc: 'Costa Rica Flag'
      }, {
        code: '1f1e8-1f1fa',
        desc: 'Cuba Flag'
      }, {
        code: '1f1e8-1f1fb',
        desc: 'Cape Verde Flag'
      }, {
        code: '1f1e8-1f1fc',
        desc: 'Curaçao Flag'
      }, {
        code: '1f1e8-1f1fd',
        desc: 'Christmas Island Flag'
      }, {
        code: '1f1e8-1f1fe',
        desc: 'Cyprus Flag'
      }, {
        code: '1f1e8-1f1ff',
        desc: 'Czechia Flag"'
      }, {
        code: '1f1e9-1f1ec',
        desc: 'Diego Garcia Flag'
      }, {
        code: '1f1e9-1f1ef',
        desc: 'Djibouti Flag'
      }, {
        code: '1f1e9-1f1f0',
        desc: 'Denmark Flag'
      }, {
        code: '1f1e9-1f1f2',
        desc: 'Dominica Flag'
      }, {
        code: '1f1e9-1f1f4',
        desc: 'Dominican Republic Flag'
      }, {
        code: '1f1e9-1f1ff',
        desc: 'Algeria Flag'
      }, {
        code: '1f1ea-1f1e6',
        desc: 'Ceuta & Melilla Flag'
      }, {
        code: '1f1ea-1f1e8',
        desc: 'Ecuador Flag'
      }, {
        code: '1f1ea-1f1ea',
        desc: 'Estonia Flag'
      }, {
        code: '1f1ea-1f1ec',
        desc: 'Egypt Flag'
      }, {
        code: '1f1ea-1f1ed',
        desc: 'Western Sahara Flag'
      }, {
        code: '1f1ea-1f1f7',
        desc: 'Eritrea Flag'
      }, {
        code: '1f1ea-1f1f9',
        desc: 'Ethiopia Flag'
      }, {
        code: '1f1ea-1f1fa',
        desc: 'European Union Flag'
      }, {
        code: '1f1eb-1f1ee',
        desc: 'Finland Flag'
      }, {
        code: '1f1eb-1f1ef',
        desc: 'Fiji Flag'
      }, {
        code: '1f1eb-1f1f0',
        desc: 'Falkland Islands Flag'
      }, {
        code: '1f1eb-1f1f2',
        desc: 'Micronesia Flag'
      }, {
        code: '1f1eb-1f1f4',
        desc: 'Faroe Islands Flag'
      }, {
        code: '1f1ec-1f1e6',
        desc: 'Gabon Flag'
      }, {
        code: '1f1ec-1f1e9',
        desc: 'Grenada Flag'
      }, {
        code: '1f1ec-1f1ea',
        desc: 'Georgia Flag'
      }, {
        code: '1f1ec-1f1eb',
        desc: 'French Guiana Flag'
      }, {
        code: '1f1ec-1f1ec',
        desc: 'Guernsey Flag'
      }, {
        code: '1f1ec-1f1ed',
        desc: 'Ghana Flag'
      }, {
        code: '1f1ec-1f1ee',
        desc: 'Gibraltar Flag'
      }, {
        code: '1f1ec-1f1f1',
        desc: 'Greenland Flag'
      }, {
        code: '1f1ec-1f1f2',
        desc: 'Gambia Flag'
      }, {
        code: '1f1ec-1f1f3',
        desc: 'Guinea Flag'
      }, {
        code: '1f1ec-1f1f5',
        desc: 'Guadeloupe Flag'
      }, {
        code: '1f1ec-1f1f6',
        desc: 'Equatorial Guinea Flag'
      }, {
        code: '1f1ec-1f1f7',
        desc: 'Greece Flag'
      }, {
        code: '1f1ec-1f1f8',
        desc: 'South Georgia & South Sandwich Islands Flag'
      }, {
        code: '1f1ec-1f1f9',
        desc: 'Guatemala Flag'
      }, {
        code: '1f1ec-1f1fa',
        desc: 'Guam Flag'
      }, {
        code: '1f1ec-1f1fc',
        desc: 'Guinea-Bissau Flag'
      }, {
        code: '1f1ec-1f1fe',
        desc: 'Guyana Flag'
      }, {
        code: '1f1ed-1f1f0',
        desc: 'Hong Kong Sar China Flag'
      }, {
        code: '1f1ed-1f1f2',
        desc: 'Heard & Mcdonald Islands Flag'
      }, {
        code: '1f1ed-1f1f3',
        desc: 'Honduras Flag'
      }, {
        code: '1f1ed-1f1f7',
        desc: 'Croatia Flag'
      }, {
        code: '1f1ed-1f1f9',
        desc: 'Haiti Flag'
      }, {
        code: '1f1ed-1f1fa',
        desc: 'Hungary Flag'
      }, {
        code: '1f1ee-1f1e8',
        desc: 'Canary Islands Flag'
      }, {
        code: '1f1ee-1f1e9',
        desc: 'Indonesia Flag'
      }, {
        code: '1f1ee-1f1ea',
        desc: 'Ireland Flag'
      }, {
        code: '1f1ee-1f1f1',
        desc: 'Israel Flag'
      }, {
        code: '1f1ee-1f1f2',
        desc: 'Isle of Man Flag'
      }, {
        code: '1f1ee-1f1f3',
        desc: 'India Flag'
      }, {
        code: '1f1ee-1f1f4',
        desc: 'British Indian Ocean Territory Flag'
      }, {
        code: '1f1ee-1f1f6',
        desc: 'Iraq Flag'
      }, {
        code: '1f1ee-1f1f7',
        desc: 'Iran Flag'
      }, {
        code: '1f1ee-1f1f8',
        desc: 'Iceland Flag'
      }, {
        code: '1f1ef-1f1ea',
        desc: 'Jersey Flag'
      }, {
        code: '1f1ef-1f1f2',
        desc: 'Jamaica Flag'
      }, {
        code: '1f1ef-1f1f4',
        desc: 'Jordan Flag'
      }, {
        code: '1f1f0-1f1ea',
        desc: 'Kenya Flag'
      }, {
        code: '1f1f0-1f1ec',
        desc: 'Kyrgyzstan Flag'
      }, {
        code: '1f1f0-1f1ed',
        desc: 'Cambodia Flag'
      }, {
        code: '1f1f0-1f1ee',
        desc: 'Kiribati Flag'
      }, {
        code: '1f1f0-1f1f2',
        desc: 'Comoros Flag'
      }, {
        code: '1f1f0-1f1f3',
        desc: 'St. Kitts & Nevis Flag'
      }, {
        code: '1f1f0-1f1f5',
        desc: 'North Korea Flag'
      }, {
        code: '1f1f0-1f1fc',
        desc: 'Kuwait Flag'
      }, {
        code: '1f1f0-1f1fe',
        desc: 'Cayman Islands Flag'
      }, {
        code: '1f1f0-1f1ff',
        desc: 'Kazakhstan Flag'
      }, {
        code: '1f1f1-1f1e6',
        desc: 'Laos Flag'
      }, {
        code: '1f1f1-1f1e7',
        desc: 'Lebanon Flag'
      }, {
        code: '1f1f1-1f1e8',
        desc: 'St. Lucia Flag'
      }, {
        code: '1f1f1-1f1ee',
        desc: 'Liechtenstein Flag'
      }, {
        code: '1f1f1-1f1f0',
        desc: 'Sri Lanka Flag'
      }, {
        code: '1f1f1-1f1f7',
        desc: 'Liberia Flag'
      }, {
        code: '1f1f1-1f1f8',
        desc: 'Lesotho Flag'
      }, {
        code: '1f1f1-1f1f9',
        desc: 'Lithuania Flag'
      }, {
        code: '1f1f1-1f1fa',
        desc: 'Luxembourg Flag'
      }, {
        code: '1f1f1-1f1fb',
        desc: 'Latvia Flag'
      }, {
        code: '1f1f1-1f1fe',
        desc: 'Libya Flag'
      }, {
        code: '1f1f2-1f1e6',
        desc: 'Morocco Flag'
      }, {
        code: '1f1f2-1f1e8',
        desc: 'Monaco Flag'
      }, {
        code: '1f1f2-1f1e9',
        desc: 'Moldova Flag'
      }, {
        code: '1f1f2-1f1ea',
        desc: 'Montenegro Flag'
      }, {
        code: '1f1f2-1f1eb',
        desc: 'St. Martin Flag'
      }, {
        code: '1f1f2-1f1ec',
        desc: 'Madagascar Flag'
      }, {
        code: '1f1f2-1f1ed',
        desc: 'Marshall Islands Flag'
      }, {
        code: '1f1f2-1f1f0',
        desc: 'Macedonia Flag'
      }, {
        code: '1f1f2-1f1f1',
        desc: 'Mali Flag'
      }, {
        code: '1f1f2-1f1f2',
        desc: 'Myanmar (burma) Flag'
      }, {
        code: '1f1f2-1f1f3',
        desc: 'Mongolia Flag'
      }, {
        code: '1f1f2-1f1f4',
        desc: 'Macau Sar China Flag'
      }, {
        code: '1f1f2-1f1f5',
        desc: 'Northern Mariana Islands Flag'
      }, {
        code: '1f1f2-1f1f6',
        desc: 'Martinique Flag'
      }, {
        code: '1f1f2-1f1f7',
        desc: 'Mauritania Flag'
      }, {
        code: '1f1f2-1f1f8',
        desc: 'Montserrat Flag'
      }, {
        code: '1f1f2-1f1f9',
        desc: 'Malta Flag'
      }, {
        code: '1f1f2-1f1fa',
        desc: 'Mauritius Flag'
      }, {
        code: '1f1f2-1f1fb',
        desc: 'Maldives Flag'
      }, {
        code: '1f1f2-1f1fc',
        desc: 'Malawi Flag'
      }, {
        code: '1f1f2-1f1fd',
        desc: 'Mexico Flag'
      }, {
        code: '1f1f2-1f1fe',
        desc: 'Malaysia Flag'
      }, {
        code: '1f1f2-1f1ff',
        desc: 'Mozambique Flag'
      }, {
        code: '1f1f3-1f1e6',
        desc: 'Namibia Flag'
      }, {
        code: '1f1f3-1f1e8',
        desc: 'New Caledonia Flag'
      }, {
        code: '1f1f3-1f1ea',
        desc: 'Niger Flag'
      }, {
        code: '1f1f3-1f1eb',
        desc: 'Norfolk Island Flag'
      }, {
        code: '1f1f3-1f1ec',
        desc: 'Nigeria Flag'
      }, {
        code: '1f1f3-1f1ee',
        desc: 'Nicaragua Flag'
      }, {
        code: '1f1f3-1f1f1',
        desc: 'Netherlands Flag'
      }, {
        code: '1f1f3-1f1f4',
        desc: 'Norway Flag'
      }, {
        code: '1f1f3-1f1f5',
        desc: 'Nepal Flag'
      }, {
        code: '1f1f3-1f1f7',
        desc: 'Nauru Flag'
      }, {
        code: '1f1f3-1f1fa',
        desc: 'Niue Flag'
      }, {
        code: '1f1f3-1f1ff',
        desc: 'New Zealand Flag'
      }, {
        code: '1f1f4-1f1f2',
        desc: 'Oman Flag'
      }, {
        code: '1f1f8-1f1ff',
        desc: 'Swaziland Flag'
      }, {
        code: '1f1f5-1f1e6',
        desc: 'Panama Flag'
      }, {
        code: '1f1f5-1f1ea',
        desc: 'Peru Flag'
      }, {
        code: '1f1f5-1f1eb',
        desc: 'French Polynesia Flag'
      }, {
        code: '1f1f5-1f1ec',
        desc: 'Papua New Guinea Flag'
      }, {
        code: '1f1f5-1f1ed',
        desc: 'Philippines Flag'
      }, {
        code: '1f1f5-1f1f0',
        desc: 'Pakistan Flag'
      }, {
        code: '1f1f5-1f1f1',
        desc: 'Poland Flag'
      }, {
        code: '1f1f5-1f1f2',
        desc: 'St. Pierre & Miquelon  Flag'
      }, {
        code: '1f1f5-1f1f3',
        desc: 'Pitcairn Islands Flag'
      }, {
        code: '1f1f5-1f1f7',
        desc: 'Puerto Rico Flag'
      }, {
        code: '1f1f5-1f1f8',
        desc: 'Palestinian Territories Flag'
      }, {
        code: '1f1f5-1f1f9',
        desc: 'Portugal Flag'
      }, {
        code: '1f1f5-1f1fc',
        desc: 'Palau Flag'
      }, {
        code: '1f1f5-1f1fe',
        desc: 'Paraguay Flag'
      }, {
        code: '1f1f6-1f1e6',
        desc: 'Qatar Flag'
      }, {
        code: '1f1f7-1f1ea',
        desc: 'Réunion Flag'
      }, {
        code: '1f1f7-1f1f4',
        desc: 'Romania Flag'
      }, {
        code: '1f1f7-1f1f8',
        desc: 'Serbia Flag'
      }, {
        code: '1f1f7-1f1fc',
        desc: 'Rwanda Flag'
      }, {
        code: '1f1f8-1f1e6',
        desc: 'Saudi Arabia Flag'
      }, {
        code: '1f1f8-1f1e7',
        desc: 'Solomon Islands Flag'
      }, {
        code: '1f1f8-1f1e8',
        desc: 'Seychelles Flag'
      }, {
        code: '1f1f8-1f1e9',
        desc: 'Sudan Flag'
      }, {
        code: '1f1f8-1f1ea',
        desc: 'Sweden Flag'
      }, {
        code: '1f1f8-1f1ec',
        desc: 'Singapore Flag'
      }, {
        code: '1f1f8-1f1ee',
        desc: 'Slovenia Flag'
      }, {
        code: '1f1f8-1f1ed',
        desc: 'St. Helena  Flag'
      }, {
        code: '1f1f8-1f1ef',
        desc: 'Svalbard & Jan Mayen  Flag'
      }, {
        code: '1f1f8-1f1f1',
        desc: 'Sierra Leone Flag'
      }, {
        code: '1f1f8-1f1f2',
        desc: 'San Marino Flag'
      }, {
        code: '1f1f8-1f1f3',
        desc: 'Senegal Flag'
      }, {
        code: '1f1f8-1f1f4',
        desc: 'Somalia Flag'
      }, {
        code: '1f1f8-1f1f7',
        desc: 'Suriname Flag'
      }, {
        code: '1f1f8-1f1f8',
        desc: 'South Sudan  Flag'
      }, {
        code: '1f1f8-1f1f9',
        desc: 'São Tomé & Príncipe Flag'
      }, {
        code: '1f1f8-1f1fb',
        desc: 'El Salvador Flag'
      }, {
        code: '1f1f8-1f1fd',
        desc: 'Sint Maarten Flag'
      }, {
        code: '1f1f8-1f1fe',
        desc: 'Syria Flag'
      }, {
        code: '1f1f9-1f1e6',
        desc: 'Tristan Da Cunha Flag'
      }, {
        code: '1f1f9-1f1e8',
        desc: 'Turks & Caicos Islands  Flag'
      }, {
        code: '1f1f9-1f1eb',
        desc: 'French Southern Territories Flag'
      }, {
        code: '1f1f9-1f1ec',
        desc: 'Togo Flag'
      }, {
        code: '1f1f9-1f1ed',
        desc: 'Thailand Flag'
      }, {
        code: '1f1f9-1f1ef',
        desc: 'Tajikistan Flag'
      }, {
        code: '1f1f9-1f1f0',
        desc: 'Tokelau Flag'
      }, {
        code: '1f1f9-1f1f1',
        desc: 'Timor-Leste Flag'
      }, {
        code: '1f1f9-1f1f2',
        desc: 'Turkmenistan Flag'
      }, {
        code: '1f1f9-1f1f3',
        desc: 'Tunisia Flag'
      }, {
        code: '1f1f9-1f1f4',
        desc: 'Tonga Flag'
      }, {
        code: '1f1f9-1f1f7',
        desc: 'Turkey Flag'
      }, {
        code: '1f1f9-1f1f9',
        desc: 'Trinidad & Tobago Flag'
      }, {
        code: '1f1f9-1f1fb',
        desc: 'Tuvalu Flag'
      }, {
        code: '1f1f9-1f1fc',
        desc: 'Taiwan Flag'
      }, {
        code: '1f1f9-1f1ff',
        desc: 'Tanzania Flag'
      }, {
        code: '1f1fa-1f1e6',
        desc: 'Ukraine City  Flag'
      }, {
        code: '1f1fa-1f1ec',
        desc: 'Uganda Flag'
      }, {
        code: '1f1fa-1f1f2',
        desc: 'U.s. Outlying Islands  Flag'
      }, {
        code: '1f1fa-1f1fe',
        desc: 'Uruguay  Flag'
      }, {
        code: '1f1fa-1f1ff',
        desc: 'Uzbekistan Flag'
      }, {
        code: '1f1fb-1f1e6',
        desc: 'Vatican City  Flag'
      }, {
        code: '1f1fb-1f1e8',
        desc: 'St. Vincent & Grenadines Flag'
      }, {
        code: '1f1fb-1f1ea',
        desc: 'Venezuela Flag'
      }, {
        code: '1f1fb-1f1ec',
        desc: 'British Virgin Islands Flag'
      }, {
        code: '1f1fb-1f1ee',
        desc: 'U.s. Virgin Islands Flag'
      }, {
        code: '1f1fb-1f1f3',
        desc: 'Vietnam Flag'
      }, {
        code: '1f1fc-1f1f8',
        desc: 'Samoa Flag'
      }, {
        code: '1f1fb-1f1fa',
        desc: 'Vanuatu Flag'
      }, {
        code: '1f1fc-1f1eb',
        desc: '"Wallis & Futuna Flag'
      }, {
        code: '1f1fd-1f1f0',
        desc: 'Kosovo Flag'
      }, {
        code: '1f1fe-1f1ea',
        desc: 'Yemen Flag'
      }, {
        code: '1f1fe-1f1f9',
        desc: 'Mayotte Flag'
      }, {
        code: '1f1ff-1f1e6',
        desc: 'South Africa Flag'
      }, {
        code: '1f1ff-1f1f2',
        desc: 'Zambia Flag'
      }, {
        code: '1f1ff-1f1fc',
        desc: 'Zimbabwe Flag'
      }, {
        code: '1f1eb-1f1f7',
        desc: 'France Flag'
      }, {
        code: '1f1ec-1f1e7',
        desc: 'United Kingdom  Flag'
      }, {
        code: '1f1ee-1f1f9',
        desc: 'Italy Flag'
      }, {
        code: '1f1ef-1f1f5',
        desc: 'Japan Flag'
      }, {
        code: '1f1f0-1f1f7',
        desc: 'South Korea Flag'
      }, {
        code: '1f1f7-1f1fa',
        desc: 'Russia Flag'
      }, {
        code: '1F6A9',
        desc: 'Triangular Flag on Post'
      }, {
        code: '1f1fa-1f1f8',
        desc: 'United States Flag'
      }]
    }],
    emoticonsButtons: ['emoticonsBack', '|'],
    emoticonsUseImage: true
  });

  FE.PLUGINS.emoticons = function (editor) {
    var $ = editor.$; // Load the categories for the emoticons

    var categories = editor.opts.emoticonsSet;
    var selectedCategory = categories && categories[0];
    var emoticonsButtons = '';
    /**
     *  Show emoticons popup
     */

    function _showEmoticonsPopup() {
      var $popup = editor.popups.get('emoticons');
      if (!$popup) $popup = _initEmoticonsPopup();

      if (!$popup.hasClass('fr-active')) {
        editor.popups.refresh('emoticons');
        editor.popups.setContainer('emoticons', editor.$tb);
        var $btn = editor.$tb.find('.fr-command[data-cmd="emoticons"]'); // Get popup left and top position

        var _editor$button$getPos = editor.button.getPosition($btn),
            left = _editor$button$getPos.left,
            top = _editor$button$getPos.top; // Show popup


        editor.popups.show('emoticons', left, top, $btn.outerHeight());
      }
    }
    /** 
     * Initialize the emoticons popup 
     */


    function _initEmoticonsPopup() {
      if (editor.opts.toolbarInline) {
        // If toolbar is inline then load emoticons buttons
        if (editor.opts.emoticonsButtons.length > 0) {
          emoticonsButtons = "<div class=\"fr-buttons fr-emoticons-buttons fr-tabs\">".concat(editor.button.buildList(editor.opts.emoticonsButtons), "</div>");
        }
      } // Template for popup


      var template = {
        buttons: emoticonsButtons,
        custom_layer: _emoticonsHTML() // Create popup

      };
      var $popup = editor.popups.create('emoticons', template); // Add accessibility to popup

      _addAccessibility($popup);

      return $popup;
    }

    function _inEmoticon() {
      if (!editor.selection.isCollapsed()) return false;
      var s_el = editor.selection.element();
      var e_el = editor.selection.endElement();
      if (s_el && editor.node.hasClass(s_el, 'fr-emoticon')) return s_el;
      if (e_el && editor.node.hasClass(e_el, 'fr-emoticon')) return e_el;
      var range = editor.selection.ranges(0);
      var container = range.startContainer;

      if (container.nodeType == Node.ELEMENT_NODE) {
        if (container.childNodes.length > 0 && range.startOffset > 0) {
          var node = container.childNodes[range.startOffset - 1];

          if (editor.node.hasClass(node, 'fr-emoticon')) {
            return node;
          }
        }
      }

      return false;
    }
    /** 
     * Add emoticon 
     */


    function addEmoticon(emoticon, img) {
      var el = _inEmoticon();

      var range = editor.selection.ranges(0);

      if (!el) {
        editor.html.insert("<span class=\"fr-emoticon fr-deletable".concat(img ? ' fr-emoticon-img' : '', "\"").concat(img ? " style=\"background: url(".concat(img, ");\"") : '', ">").concat(img ? '&nbsp;' : emoticon, "</span>&nbsp;"), true);
      } else {
        if (range.startOffset === 0 && editor.selection.element() === el) {
          $(el).before(FE.MARKERS + FE.INVISIBLE_SPACE);
        } else if (range.startOffset > 0 && editor.selection.element() === el && range.commonAncestorContainer.parentNode.classList.contains('fr-emoticon')) {
          // Inside emoticon move out side of it.
          $(el).after(FE.INVISIBLE_SPACE + FE.MARKERS);
        }

        editor.selection.restore();
        editor.html.insert("<span class=\"fr-emoticon fr-deletable".concat(img ? ' fr-emoticon-img' : '', "\"").concat(img ? " style=\"background: url(".concat(img, ");\"") : '', ">").concat(img ? '&nbsp;' : emoticon, "</span>&nbsp;").concat(FE.MARKERS), true);
      }
    }
    /** 
     * Load emoticons
     */


    function _load() {
      var setDeletable = function setDeletable() {
        var emtcs = editor.el.querySelectorAll('.fr-emoticon:not(.fr-deletable)');

        for (var i = 0; i < emtcs.length; i++) {
          emtcs[i].className += ' fr-deletable';
        }
      };

      setDeletable();
      editor.events.on('html.set', setDeletable);
      editor.events.on('keydown', function (e) {
        if (editor.keys.isCharacter(e.which) && editor.selection.inEditor()) {
          var range = editor.selection.ranges(0);

          var el = _inEmoticon();

          if (editor.node.hasClass(el, 'fr-emoticon-img')) {
            if (el) {
              if (range.startOffset === 0 && editor.selection.element() === el) {
                $(el).before(FE.MARKERS + FE.INVISIBLE_SPACE);
              } else {
                $(el).after(FE.INVISIBLE_SPACE + FE.MARKERS);
              }

              editor.selection.restore();
            }
          }
        }
      });
      editor.events.on('keyup', function (e) {
        var emtcs = editor.el.querySelectorAll('.fr-emoticon');

        for (var i = 0; i < emtcs.length; i++) {
          if (typeof emtcs[i].textContent != 'undefined' && emtcs[i].textContent.replace(/\u200B/gi, '').length === 0) {
            $(emtcs[i]).remove();
          }
        }

        if (!(e.which >= FE.KEYCODE.ARROW_LEFT && e.which <= FE.KEYCODE.ARROW_DOWN)) {
          var el = _inEmoticon();

          if (editor.node.hasClass(el, 'fr-emoticon-img')) {
            $(el).append(FE.MARKERS);
            editor.selection.restore();
          }
        }
      });
    }
    /**
      * Returns the HTML for the emoticons popup.
      */


    function _emoticonsHTML() {
      var emoticons_html = '';
      emoticons_html = "".concat(_renderCategoryHtml(categories, selectedCategory), "\n                      ").concat(_renderEmoticonHtml(selectedCategory), "\n                      ").concat(_renderUseImage());
      return emoticons_html;
    }
    /**
      * Replaces the pop-up's HTML with updated HTML - should be called
      * when the selected category changes.
      */


    function _refreshPopup() {
      editor.popups.get('emoticons').html(emoticonsButtons + _emoticonsHTML());
    }
    /**
      * Set the currently selected emoticon category and refresh the popup
      */


    function setEmoticonCategory(categoryId) {
      selectedCategory = categories.filter(function (category) {
        return category.id === categoryId;
      })[0]; // Refresh the popup to update the emoticons in the popup view

      _refreshPopup();
    }
    /**
      * Returns the HTML of the Category selector
      */


    function _renderCategoryHtml(categories, selectedCategory) {
      var categoryHtml = "<div class=\"fr-buttons fr-tabs fr-tabs-scroll\">\n                        ".concat(_renderCategory(categories, selectedCategory), "\n                        </div>");
      return categoryHtml;
    }
    /** 
     * Returns the HTML for the emoticon selector part of the popup 
     */


    function _renderEmoticonHtml(selectedCategory) {
      var emoticonHtml = "\n        <div class=\"fr-icon-container fr-emoticon-container\">\n            ".concat(_renderEmoticon(selectedCategory), "\n        </div>\n        ");
      return emoticonHtml;
    }
    /** 
     * Register keyboard events. 
     */


    function _addAccessibility($popup) {
      // Register popup event.
      editor.events.on('popup.tab', function (e) {
        var $focused_item = $(e.currentTarget); // Skip if popup is not visible or focus is elsewere.

        if (!editor.popups.isVisible('emoticons') || !$focused_item.is('span, a')) {
          return true;
        }

        var key_code = e.which;
        var status;
        var index;
        var $el; // Tabbing.

        if (FE.KEYCODE.TAB == key_code) {
          // Extremities reached.
          if ($focused_item.is('span.fr-emoticon') && e.shiftKey || $focused_item.is('a') && !e.shiftKey) {
            var $tb = $popup.find('.fr-buttons'); // Focus back the popup's toolbar if exists.

            status = !editor.accessibility.focusToolbar($tb, e.shiftKey ? true : false);
          }

          if (status !== false) {
            // Build elements that should be focused next.
            var $tabElements = $popup.find('span.fr-emoticon:focus').first().concat($popup.findVisible(' div.fr-tabs').first().concat($popup.find('a')));

            if ($focused_item.is('span.fr-emoticon')) {
              $tabElements = $tabElements.not('span.fr-emoticon:not(:focus)');
            } // Get focused item position.


            index = $tabElements.index($focused_item); // Backwards.

            if (e.shiftKey) {
              index = ((index - 1) % $tabElements.length + $tabElements.length) % $tabElements.length; // Javascript negative modulo bug.
              // Forward.
            } else {
              index = (index + 1) % $tabElements.length;
            } // Find next element to focus.


            $el = $tabElements.get(index);
            editor.events.disableBlur();
            $el.focus();
            status = false;
          }
        } // Arrows.
        else if (FE.KEYCODE.ARROW_UP == key_code || FE.KEYCODE.ARROW_DOWN == key_code || FE.KEYCODE.ARROW_LEFT == key_code || FE.KEYCODE.ARROW_RIGHT == key_code) {
            if ($focused_item.is('span.fr-emoticon')) {
              // Get all current emoticons.
              var $emoticons = $focused_item.parent().find('span.fr-emoticon'); // Get focused item position.

              index = $emoticons.index($focused_item); // Get emoticons matrix dimensions.

              var columns = editor.opts.emoticonsStep;
              var lines = Math.floor($emoticons.length / columns); // Get focused item coordinates.

              var column = index % columns;
              var line = Math.floor(index / columns);
              var nextIndex = line * columns + column;
              var dimension = lines * columns; // Calculate next index. Go to the other opposite site of the matrix if there is no next adjacent element.
              // Up/Down: Traverse matrix lines.
              // Left/Right: Traverse the matrix as it is a vector.

              if (FE.KEYCODE.ARROW_UP == key_code) {
                nextIndex = ((nextIndex - columns) % dimension + dimension) % dimension; // Javascript negative modulo bug.
              } else if (FE.KEYCODE.ARROW_DOWN == key_code) {
                nextIndex = (nextIndex + columns) % dimension;
              } else if (FE.KEYCODE.ARROW_LEFT == key_code) {
                nextIndex = ((nextIndex - 1) % dimension + dimension) % dimension; // Javascript negative modulo bug.
              } else if (FE.KEYCODE.ARROW_RIGHT == key_code) {
                nextIndex = (nextIndex + 1) % dimension;
              } // Get the next element based on the new index.


              $el = $($emoticons.get(nextIndex)); // Focus.

              editor.events.disableBlur();
              $el.focus();
              status = false;
            }
          } // ENTER or SPACE.
          else if (FE.KEYCODE.ENTER == key_code) {
              if ($focused_item.is('a')) {
                $focused_item[0].click();
              } else {
                editor.button.exec($focused_item);
              }

              status = false;
            } // Prevent propagation.


        if (status === false) {
          e.preventDefault();
          e.stopPropagation();
        }

        return status;
      }, true);
    }
    /*
       * Go back to the inline editor.
       */


    function back() {
      editor.popups.hide('emoticons');
      editor.toolbar.showInline();
    }
    /** 
     * Render and return the emoticon span html
     */


    function _renderEmoticon(selectedCategory) {
      var emoticon_html = '';
      selectedCategory.emoticons.forEach(function (emoticon) {
        var compiledCode = emoticon.code.split('-').reduce(function (compiledCode, code) {
          return compiledCode ? compiledCode + '&zwj;' + '&#x' + code.toLowerCase() + ';' : '&#x' + code.toLowerCase() + ';';
        }, '');
        var imageMap = {
          image: emoticon.code.toLowerCase(),
          compiledCode: emoticon.uCode ? emoticon.uCode : compiledCode
        };
        var emoticonMap = {
          dataParam1: emoticon.code.toLowerCase(),
          dataParam2: imageMap.compiledCode,
          title: editor.language.translate(emoticon.desc),
          image: editor.opts.emoticonsUseImage ? "<img src=\"https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/".concat(imageMap.image, ".svg\"/>") : "".concat(imageMap.compiledCode),
          desc: editor.language.translate(emoticon.desc)
        };
        emoticon_html += "<span class=\"fr-command fr-emoticon fr-icon\" role=\"button\" \n      data-cmd=\"insertEmoticon\" data-param1=\"".concat(emoticonMap.dataParam1, "\" \n      data-param2=\"").concat(emoticonMap.dataParam2, "\"  title=\"").concat(emoticonMap.title, "\" >\n      ").concat(emoticonMap.image, "<span class=\"fr-sr-only\">").concat(emoticonMap.desc, "&nbsp;&nbsp;&nbsp;</span></span>");
      });
      return emoticon_html;
    }
    /** 
     * Render and return tab button html
     */


    function _renderCategory(categories, selectedCategory) {
      var buttonHtml = '';
      categories.forEach(function (category) {
        var imageMap = {
          image: category.code.toLowerCase()
        };
        var buttonMap = {
          elementClass: category.id === selectedCategory.id ? 'fr-active fr-active-tab' : '',
          emoticonsUnicodeClass: editor.opts.emoticonsUseImage ? '' : 'fr-tabs-unicode',
          title: editor.language.translate(category.name),
          dataCmd: 'setEmoticonCategory',
          dataParam1: category.id,
          image: editor.opts.emoticonsUseImage ? "<img src=\"https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/".concat(imageMap.image, ".svg\"/>") : "&#x".concat(imageMap.image, ";")
        };
        buttonHtml += "<button class=\"fr-command fr-btn ".concat(buttonMap.elementClass, " ").concat(buttonMap.emoticonsUnicodeClass, "\" \n      title=\"").concat(buttonMap.title, "\" data-cmd=\"").concat(buttonMap.dataCmd, "\" data-param1=\"").concat(buttonMap.dataParam1, "\">\n       ").concat(buttonMap.image, " </button>");
      });
      return buttonHtml;
    }
    /**
     * Render image if emoticonsUseImage option is set to 'true'
     */


    function _renderUseImage() {
      if (editor.opts.emoticonsUseImage) {
        return '<p style="font-size: 12px; text-align: center; padding: 0 5px;">Emoji free by <a class="fr-link" tabIndex="-1" href="http://emojione.com/" target="_blank" rel="nofollow noopener noreferrer" role="link" aria-label="Open Emoji One website.">Emoji One</a></p>';
      } else {
        return '';
      }
    }

    return {
      _init: _load,
      insert: addEmoticon,
      setEmoticonCategory: setEmoticonCategory,
      showEmoticonsPopup: _showEmoticonsPopup,
      back: back
    };
  }; // Toolbar emoticons button.


  FE.DefineIcon('emoticons', {
    NAME: 'smile-o',
    FA5NAME: 'smile',
    SVG_KEY: 'smile'
  });
  FE.RegisterCommand('emoticons', {
    title: 'Emoticons',
    undo: false,
    focus: true,
    refreshAfterCallback: false,
    popup: true,
    callback: function callback() {
      if (this.popups.isVisible('emoticons')) {
        if (this.$el.find('.fr-marker').length) {
          this.events.disableBlur();
          this.selection.restore();
        }

        this.popups.hide('emoticons');
      } else {
        this.emoticons.showEmoticonsPopup();
      }
    },
    plugin: 'emoticons'
  }); // Insert emoticon command.

  FE.RegisterCommand('insertEmoticon', {
    callback: function callback(cmd, code, compiledCode) {
      // Insert emoticon
      this.emoticons.insert(compiledCode, this.opts.emoticonsUseImage ? "https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/".concat(code, ".svg") : null); // Hide emoticons popup.

      this.popups.hide('emoticons');
    }
  });
  /* set and show the emoticon category */

  FE.RegisterCommand('setEmoticonCategory', {
    undo: false,
    focus: false,
    callback: function callback(cmd, category) {
      this.emoticons.setEmoticonCategory(category);
    }
  }); // Emoticons back.

  FE.DefineIcon('emoticonsBack', {
    NAME: 'arrow-left',
    SVG_KEY: 'back'
  });
  FE.RegisterCommand('emoticonsBack', {
    title: 'Back',
    undo: false,
    focus: false,
    back: true,
    refreshAfterCallback: false,
    callback: function callback() {
      this.emoticons.back();
    }
  });

  Object.assign(FE.DEFAULTS, {
    entities: '&quot;&#39;&iexcl;&cent;&pound;&curren;&yen;&brvbar;&sect;&uml;&copy;&ordf;&laquo;&not;&shy;' + '&reg;&macr;&deg;&plusmn;&sup2;&sup3;&acute;&micro;&para;&middot;&cedil;&sup1;&ordm;&raquo;&frac14;' + '&frac12;&frac34;&iquest;&Agrave;&Aacute;&Acirc;&Atilde;&Auml;&Aring;&AElig;&Ccedil;&Egrave;&Eacute;' + '&Ecirc;&Euml;&Igrave;&Iacute;&Icirc;&Iuml;&ETH;&Ntilde;&Ograve;&Oacute;&Ocirc;&Otilde;&Ouml;&times;' + '&Oslash;&Ugrave;&Uacute;&Ucirc;&Uuml;&Yacute;&THORN;&szlig;&agrave;&aacute;&acirc;&atilde;&auml;&aring;' + '&aelig;&ccedil;&egrave;&eacute;&ecirc;&euml;&igrave;&iacute;&icirc;&iuml;&eth;&ntilde;&ograve;&oacute;' + '&ocirc;&otilde;&ouml;&divide;&oslash;&ugrave;&uacute;&ucirc;&uuml;&yacute;&thorn;&yuml;&OElig;&oelig;' + '&Scaron;&scaron;&Yuml;&fnof;&circ;&tilde;&Alpha;&Beta;&Gamma;&Delta;&Epsilon;&Zeta;&Eta;&Theta;&Iota;' + '&Kappa;&Lambda;&Mu;&Nu;&Xi;&Omicron;&Pi;&Rho;&Sigma;&Tau;&Upsilon;&Phi;&Chi;&Psi;&Omega;&alpha;&beta;' + '&gamma;&delta;&epsilon;&zeta;&eta;&theta;&iota;&kappa;&lambda;&mu;&nu;&xi;&omicron;&pi;&rho;&sigmaf;' + '&sigma;&tau;&upsilon;&phi;&chi;&psi;&omega;&thetasym;&upsih;&piv;&ensp;&emsp;&thinsp;&zwnj;&zwj;&lrm;' + '&rlm;&ndash;&mdash;&lsquo;&rsquo;&sbquo;&ldquo;&rdquo;&bdquo;&dagger;&Dagger;&bull;&hellip;&permil;' + '&prime;&Prime;&lsaquo;&rsaquo;&oline;&frasl;&euro;&image;&weierp;&real;&trade;&alefsym;&larr;&uarr;' + '&rarr;&darr;&harr;&crarr;&lArr;&uArr;&rArr;&dArr;&hArr;&forall;&part;&exist;&empty;&nabla;&isin;&notin;' + '&ni;&prod;&sum;&minus;&lowast;&radic;&prop;&infin;&ang;&and;&or;&cap;&cup;&int;&there4;&sim;&cong;&asymp;' + '&ne;&equiv;&le;&ge;&sub;&sup;&nsub;&sube;&supe;&oplus;&otimes;&perp;&sdot;&lceil;&rceil;&lfloor;&rfloor;' + '&lang;&rang;&loz;&spades;&clubs;&hearts;&diams;'
  });

  FE.PLUGINS.entities = function (editor) {
    var $ = editor.$;

    var _reg_exp;

    var _map; // if &, then index should be 0


    function _process(el) {
      var text = el.textContent;

      if (text.match(_reg_exp)) {
        var new_text = '';

        for (var j = 0; j < text.length; j++) {
          if (_map[text[j]]) new_text += _map[text[j]];else new_text += text[j];
        }

        el.textContent = new_text;
      }
    }

    function _encode(el) {
      if (el && ['STYLE', 'SCRIPT', 'svg', 'IFRAME'].indexOf(el.tagName) >= 0) return true;
      var contents = editor.node.contents(el); // Process contents.

      for (var i = 0; i < contents.length; i++) {
        if (contents[i].nodeType === Node.TEXT_NODE) {
          _process(contents[i]);
        } else {
          _encode(contents[i]);
        }
      } // Process node itself.


      if (el.nodeType === Node.TEXT_NODE) _process(el);
      return false;
    }
    /**
     * Encode entities.
     */


    function _encodeEntities(html) {
      if (html.length === 0) return '';
      return editor.clean.exec(html, _encode).replace(/\&amp;/g, '&');
    }
    /*
     * Initialize.
     */


    function _init() {
      if (!editor.opts.htmlSimpleAmpersand) {
        editor.opts.entities = editor.opts.entities + '&amp;';
      } // Do escape.


      var entities_text = $(document.createElement('div')).html(editor.opts.entities).text();
      var entities_array = editor.opts.entities.split(';');
      _map = {};
      _reg_exp = '';

      for (var i = 0; i < entities_text.length; i++) {
        var chr = entities_text.charAt(i);
        _map[chr] = entities_array[i] + ';';
        _reg_exp += '\\' + chr + (i < entities_text.length - 1 ? '|' : '');
      }

      _reg_exp = new RegExp('(' + _reg_exp + ')', 'g');
      editor.events.on('html.get', _encodeEntities, true);
    }

    return {
      _init: _init
    };
  };

  Object.assign(FE.POPUP_TEMPLATES, {
    'file.insert': '[_BUTTONS_][_UPLOAD_LAYER_][_PROGRESS_BAR_]'
  }); // Extend defaults.

  Object.assign(FE.DEFAULTS, {
    fileUpload: true,
    fileUploadURL: null,
    fileUploadParam: 'file',
    fileUploadParams: {},
    fileUploadToS3: false,
    fileUploadMethod: 'POST',
    fileMaxSize: 10 * 1024 * 1024,
    fileAllowedTypes: ['*'],
    fileInsertButtons: ['fileBack', '|'],
    fileUseSelectedText: false
  });

  FE.PLUGINS.file = function (editor) {
    var $ = editor.$;
    var DEFAULT_FILE_UPLOAD_URL = 'https://i.froala.com/upload';
    var BAD_LINK = 1;
    var MISSING_LINK = 2;
    var ERROR_DURING_UPLOAD = 3;
    var BAD_RESPONSE = 4;
    var MAX_SIZE_EXCEEDED = 5;
    var BAD_FILE_TYPE = 6;
    var NO_CORS_IE = 7;
    var error_messages = {};
    error_messages[BAD_LINK] = 'File cannot be loaded from the passed link.';
    error_messages[MISSING_LINK] = 'No link in upload response.';
    error_messages[ERROR_DURING_UPLOAD] = 'Error during file upload.';
    error_messages[BAD_RESPONSE] = 'Parsing response failed.';
    error_messages[MAX_SIZE_EXCEEDED] = 'File is too large.';
    error_messages[BAD_FILE_TYPE] = 'File file type is invalid.';
    error_messages[NO_CORS_IE] = 'Files can be uploaded only to same domain in IE 8 and IE 9.';

    function showInsertPopup() {
      var $btn = editor.$tb.find('.fr-command[data-cmd="insertFile"]');
      var $popup = editor.popups.get('file.insert');
      if (!$popup) $popup = _initInsertPopup();
      hideProgressBar();

      if (!$popup.hasClass('fr-active')) {
        editor.popups.refresh('file.insert');
        editor.popups.setContainer('file.insert', editor.$tb);

        if ($btn.isVisible) {
          var _editor$button$getPos = editor.button.getPosition($btn),
              left = _editor$button$getPos.left,
              top = _editor$button$getPos.top;

          editor.popups.show('file.insert', left, top, $btn.outerHeight());
        } else {
          editor.position.forSelection($popup);
          editor.popups.show('file.insert');
        }
      }
    }
    /**
     * Show progress bar.
     */


    function showProgressBar() {
      var $popup = editor.popups.get('file.insert');
      if (!$popup) $popup = _initInsertPopup();
      $popup.find('.fr-layer.fr-active').removeClass('fr-active').addClass('fr-pactive');
      $popup.find('.fr-file-progress-bar-layer').addClass('fr-active');
      $popup.find('.fr-buttons').hide();

      _setProgressMessage(editor.language.translate('Uploading'), 0);
    }
    /**
     * Hide progress bar.
     */


    function hideProgressBar(dismiss) {
      var $popup = editor.popups.get('file.insert');

      if ($popup) {
        $popup.find('.fr-layer.fr-pactive').addClass('fr-active').removeClass('fr-pactive');
        $popup.find('.fr-file-progress-bar-layer').removeClass('fr-active');
        $popup.find('.fr-buttons').show();

        if (dismiss) {
          editor.events.focus();
          editor.popups.hide('file.insert');
        }
      }
    }
    /**
     * Set a progress message.
     */


    function _setProgressMessage(message, progress) {
      var $popup = editor.popups.get('file.insert');

      if ($popup) {
        var $layer = $popup.find('.fr-file-progress-bar-layer');
        $layer.find('h3').text(message + (progress ? ' ' + progress + '%' : ''));
        $layer.removeClass('fr-error');

        if (progress) {
          $layer.find('div').removeClass('fr-indeterminate');
          $layer.find('div > span').css('width', progress + '%');
        } else {
          $layer.find('div').addClass('fr-indeterminate');
        }
      }
    }
    /**
     * Show error message to the user.
     */


    function _showErrorMessage(message) {
      showProgressBar();
      var $popup = editor.popups.get('file.insert');
      var $layer = $popup.find('.fr-file-progress-bar-layer');
      $layer.addClass('fr-error');
      var $message_header = $layer.find('h3');
      $message_header.text(message);
      editor.events.disableBlur();
      $message_header.focus();
    }
    /**
     * Insert the uploaded file.
     */


    function insert(link, text, response) {
      editor.edit.on(); // Focus in the editor.

      editor.events.focus(true);
      editor.selection.restore();

      if (editor.opts.fileUseSelectedText && editor.selection.text().length) {
        text = editor.selection.text();
      } // Insert the link.


      editor.html.insert('<a href="' + link + '" target="_blank" id="fr-inserted-file" class="fr-file">' + text + '</a>'); // Get the file.

      var $file = editor.$el.find('#fr-inserted-file');
      $file.removeAttr('id');
      editor.popups.hide('file.insert');
      editor.undo.saveStep();

      _syncFiles();

      editor.events.trigger('file.inserted', [$file, response]);
    }
    /**
     * Parse file response.
     */


    function _parseResponse(response) {
      try {
        if (editor.events.trigger('file.uploaded', [response], true) === false) {
          editor.edit.on();
          return false;
        }

        var resp = JSON.parse(response);

        if (resp.link) {
          return resp;
        } else {
          // No link in upload request.
          _throwError(MISSING_LINK, response);

          return false;
        }
      } catch (ex) {
        // Bad response.
        _throwError(BAD_RESPONSE, response);

        return false;
      }
    }
    /**
     * Parse file response.
     */


    function _parseXMLResponse(response) {
      try {
        var link = $(response).find('Location').text();
        var key = $(response).find('Key').text();

        if (editor.events.trigger('file.uploadedToS3', [link, key, response], true) === false) {
          editor.edit.on();
          return false;
        }

        return link;
      } catch (ex) {
        // Bad response.
        _throwError(BAD_RESPONSE, response);

        return false;
      }
    }
    /**
     * File was uploaded to the server and we have a response.
     */


    function _fileUploaded(text) {
      var status = this.status;
      var response = this.response;
      var responseXML = this.responseXML;
      var responseText = this.responseText;

      try {
        if (editor.opts.fileUploadToS3) {
          if (status === 201) {
            var link = _parseXMLResponse(responseXML);

            if (link) {
              insert(link, text, response || responseXML);
            }
          } else {
            _throwError(BAD_RESPONSE, response || responseXML);
          }
        } else {
          if (status >= 200 && status < 300) {
            var resp = _parseResponse(responseText);

            if (resp) {
              insert(resp.link, text, response || responseText);
            }
          } else {
            _throwError(ERROR_DURING_UPLOAD, response || responseText);
          }
        }
      } catch (ex) {
        // Bad response.
        _throwError(BAD_RESPONSE, response || responseText);
      }
    }
    /**
     * File upload error.
     */


    function _fileUploadError() {
      _throwError(BAD_RESPONSE, this.response || this.responseText || this.responseXML);
    }
    /**
     * File upload progress.
     */


    function _fileUploadProgress(e) {
      if (e.lengthComputable) {
        var complete = e.loaded / e.total * 100 | 0;

        _setProgressMessage(editor.language.translate('Uploading'), complete);
      }
    }
    /**
     * Throw an file error.
     */


    function _throwError(code, response) {
      editor.edit.on();

      _showErrorMessage(editor.language.translate('Something went wrong. Please try again.'));

      editor.events.trigger('file.error', [{
        code: code,
        message: error_messages[code]
      }, response]);
    }
    /**
     * File upload aborted.
     */


    function _fileUploadAborted() {
      editor.edit.on();
      hideProgressBar(true);
    }

    function _browserUpload(file) {
      var reader = new FileReader();

      reader.onload = function () {
        var link = reader.result; // Convert image to local blob.

        var binary = atob(reader.result.split(',')[1]);
        var array = [];

        for (var i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        } // Get local image link.


        link = window.URL.createObjectURL(new Blob([new Uint8Array(array)], {
          type: file.type
        }));
        editor.file.insert(link, file.name, null);
      };

      showProgressBar();
      reader.readAsDataURL(file);
    }

    function upload(files) {
      // Make sure we have what to upload.
      if (typeof files !== 'undefined' && files.length > 0) {
        // Check if we should cancel the file upload.
        if (editor.events.trigger('file.beforeUpload', [files]) === false) {
          return false;
        }

        var file = files[0]; // Upload as blob for testing purposes.

        if ((editor.opts.fileUploadURL === null || editor.opts.fileUploadURL === DEFAULT_FILE_UPLOAD_URL) && !editor.opts.fileUploadToS3) {
          _browserUpload(file);

          return false;
        } // Check file max size.


        if (file.size > editor.opts.fileMaxSize) {
          _throwError(MAX_SIZE_EXCEEDED);

          return false;
        } // Check file types.


        if (editor.opts.fileAllowedTypes.indexOf('*') < 0 && editor.opts.fileAllowedTypes.indexOf(file.type.replace(/file\//g, '')) < 0) {
          _throwError(BAD_FILE_TYPE);

          return false;
        } // Create form Data.


        var form_data;

        if (editor.drag_support.formdata) {
          form_data = editor.drag_support.formdata ? new FormData() : null;
        } // Prepare form data for request.


        if (form_data) {
          var key; // Upload to S3.

          if (editor.opts.fileUploadToS3 !== false) {
            form_data.append('key', editor.opts.fileUploadToS3.keyStart + new Date().getTime() + '-' + (file.name || 'untitled'));
            form_data.append('success_action_status', '201');
            form_data.append('X-Requested-With', 'xhr');
            form_data.append('Content-Type', file.type);

            for (key in editor.opts.fileUploadToS3.params) {
              if (editor.opts.fileUploadToS3.params.hasOwnProperty(key)) {
                form_data.append(key, editor.opts.fileUploadToS3.params[key]);
              }
            }
          } // Add upload params.


          for (key in editor.opts.fileUploadParams) {
            if (editor.opts.fileUploadParams.hasOwnProperty(key)) {
              form_data.append(key, editor.opts.fileUploadParams[key]);
            }
          } // Set the file in the request.


          form_data.append(editor.opts.fileUploadParam, file); // Create XHR request.

          var url = editor.opts.fileUploadURL;

          if (editor.opts.fileUploadToS3) {
            if (editor.opts.fileUploadToS3.uploadURL) {
              url = editor.opts.fileUploadToS3.uploadURL;
            } else {
              url = 'https://' + editor.opts.fileUploadToS3.region + '.amazonaws.com/' + editor.opts.fileUploadToS3.bucket;
            }
          }

          var xhr = editor.core.getXHR(url, editor.opts.fileUploadMethod); // Set upload events.

          xhr.onload = function () {
            _fileUploaded.call(xhr, file.name);
          };

          xhr.onerror = _fileUploadError;
          xhr.upload.onprogress = _fileUploadProgress;
          xhr.onabort = _fileUploadAborted;
          showProgressBar(); // editor.edit.off()

          var $popup = editor.popups.get('file.insert');

          if ($popup) {
            $popup.off('abortUpload');
            $popup.on('abortUpload', function () {
              if (xhr.readyState !== 4) {
                xhr.abort();
              }
            });
          } // Send data.


          xhr.send(form_data);
        }
      }
    }

    function _bindInsertEvents($popup) {
      // Drag over the dropable area.
      editor.events.$on($popup, 'dragover dragenter', '.fr-file-upload-layer', function () {
        $(this).addClass('fr-drop');
        return false;
      }, true); // Drag end.

      editor.events.$on($popup, 'dragleave dragend', '.fr-file-upload-layer', function () {
        $(this).removeClass('fr-drop');
        return false;
      }, true); // Drop.

      editor.events.$on($popup, 'drop', '.fr-file-upload-layer', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('fr-drop');
        var dt = e.originalEvent.dataTransfer;

        if (dt && dt.files) {
          var inst = $popup.data('instance') || editor;
          inst.file.upload(dt.files);
        }
      }, true);

      if (editor.helpers.isIOS()) {
        editor.events.$on($popup, 'touchstart', '.fr-file-upload-layer input[type="file"]', function () {
          $(this).trigger('click');
        });
      }

      editor.events.$on($popup, 'change', '.fr-file-upload-layer input[type="file"]', function () {
        if (this.files) {
          var inst = $popup.data('instance') || editor;
          inst.events.disableBlur();
          $popup.find('input:focus').blur();
          inst.events.enableBlur();
          inst.file.upload(this.files);
        } // Else IE 9 case.
        // Chrome fix.


        $(this).val('');
      }, true);
    }

    function _hideInsertPopup() {
      hideProgressBar();
    }

    function _initInsertPopup(delayed) {
      if (delayed) {
        editor.popups.onHide('file.insert', _hideInsertPopup);
        return true;
      } // Image buttons.


      var file_buttons = '';

      if (!editor.opts.fileUpload) {
        editor.opts.fileInsertButtons.splice(editor.opts.fileInsertButtons.indexOf('fileUpload'), 1);
      }

      file_buttons = '<div class="fr-buttons fr-tabs">' + editor.button.buildList(editor.opts.fileInsertButtons) + '</div>'; // File upload layer.

      var upload_layer = '';

      if (editor.opts.fileUpload) {
        upload_layer = '<div class="fr-file-upload-layer fr-layer fr-active" id="fr-file-upload-layer-' + editor.id + '"><strong>' + editor.language.translate('Drop file') + '</strong><br>(' + editor.language.translate('or click') + ')<div class="fr-form"><input type="file" name="' + editor.opts.fileUploadParam + '" accept="' + (editor.opts.fileAllowedTypes.indexOf('*') >= 0 ? '/' : '') + editor.opts.fileAllowedTypes.join(', ').toLowerCase() + '" tabIndex="-1" aria-labelledby="fr-file-upload-layer-' + editor.id + '" role="button"></div></div>';
      } // Progress bar.


      var progress_bar_layer = '<div class="fr-file-progress-bar-layer fr-layer"><h3 tabIndex="-1" class="fr-message">Uploading</h3><div class="fr-loader"><span class="fr-progress"></span></div><div class="fr-action-buttons"><button type="button" class="fr-command fr-dismiss" data-cmd="fileDismissError" tabIndex="2" role="button">OK</button></div></div>';
      var template = {
        buttons: file_buttons,
        upload_layer: upload_layer,
        progress_bar: progress_bar_layer // Set the template in the popup.

      };
      var $popup = editor.popups.create('file.insert', template);

      _bindInsertEvents($popup);

      return $popup;
    }

    function _onRemove(link) {
      if (editor.node.hasClass(link, 'fr-file')) {
        return;
      }
    }

    function _drop(e) {
      // Check if we are dropping files.
      var dt = e.originalEvent.dataTransfer;

      if (dt && dt.files && dt.files.length) {
        var file = dt.files[0];

        if (file && typeof file.type !== 'undefined') {
          // Dropped file is an file that we allow.
          if (file.type.indexOf('image') < 0) {
            if (!editor.opts.fileUpload) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }

            editor.markers.remove();
            editor.markers.insertAtPoint(e.originalEvent);
            editor.$el.find('.fr-marker').replaceWith(FE.MARKERS); // Hide popups.

            editor.popups.hideAll(); // Show the file insert popup.

            var $popup = editor.popups.get('file.insert');
            if (!$popup) $popup = _initInsertPopup();
            editor.popups.setContainer('file.insert', editor.$sc);
            editor.popups.show('file.insert', e.originalEvent.pageX, e.originalEvent.pageY);
            showProgressBar(); // Upload files.

            upload(dt.files); // Cancel anything else.

            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        } else if (file.type.indexOf('image') < 0) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }

    function _initEvents() {
      // Drop inside the editor.
      editor.events.on('drop', _drop);
      editor.events.$on(editor.$win, 'keydown', function (e) {
        var key_code = e.which;
        var $popup = editor.popups.get('file.insert');

        if ($popup && key_code === FE.KEYCODE.ESC) {
          $popup.trigger('abortUpload');
        }
      });
      editor.events.on('destroy', function () {
        var $popup = editor.popups.get('file.insert');

        if ($popup) {
          $popup.trigger('abortUpload');
        }
      });
    }

    function back() {
      editor.events.disableBlur();
      editor.selection.restore();
      editor.events.enableBlur();
      editor.popups.hide('file.insert');
      editor.toolbar.showInline();
    }

    var files;

    function _syncFiles() {
      // Get current files.
      var c_files = Array.prototype.slice.call(editor.el.querySelectorAll('a.fr-file')); // Current files src.

      var file_srcs = [];
      var i;

      for (i = 0; i < c_files.length; i++) {
        file_srcs.push(c_files[i].getAttribute('href'));
      } // Loop previous files and check their src.


      if (files) {
        for (i = 0; i < files.length; i++) {
          if (file_srcs.indexOf(files[i].getAttribute('href')) < 0) {
            editor.events.trigger('file.unlink', [files[i]]);
          }
        }
      } // Current files are the old ones.


      files = c_files;
    }
    /*
     * Initialize.
     */


    function _init() {
      _initEvents();

      editor.events.on('link.beforeRemove', _onRemove);

      if (editor.$wp) {
        _syncFiles();

        editor.events.on('contentChanged', _syncFiles);
      }

      _initInsertPopup(true);
    }

    return {
      _init: _init,
      showInsertPopup: showInsertPopup,
      upload: upload,
      insert: insert,
      back: back,
      hideProgressBar: hideProgressBar
    };
  }; // Insert file button.


  FE.DefineIcon('insertFile', {
    NAME: 'file-o',
    FA5NAME: 'file',
    SVG_KEY: 'insertFile'
  });
  FE.RegisterCommand('insertFile', {
    title: 'Upload File',
    undo: false,
    focus: true,
    refreshAfterCallback: false,
    popup: true,
    callback: function callback() {
      if (!this.popups.isVisible('file.insert')) {
        this.file.showInsertPopup();
      } else {
        if (this.$el.find('.fr-marker').length) {
          this.events.disableBlur();
          this.selection.restore();
        }

        this.popups.hide('file.insert');
      }
    },
    plugin: 'file'
  });
  FE.DefineIcon('fileBack', {
    NAME: 'arrow-left',
    SVG_KEY: 'back'
  });
  FE.RegisterCommand('fileBack', {
    title: 'Back',
    undo: false,
    focus: false,
    back: true,
    refreshAfterCallback: false,
    callback: function callback() {
      this.file.back();
    },
    refresh: function refresh($btn) {
      if (!this.opts.toolbarInline) {
        $btn.addClass('fr-hidden');
        $btn.next('.fr-separator').addClass('fr-hidden');
      } else {
        $btn.removeClass('fr-hidden');
        $btn.next('.fr-separator').removeClass('fr-hidden');
      }
    }
  });
  FE.RegisterCommand('fileDismissError', {
    title: 'OK',
    callback: function callback() {
      this.file.hideProgressBar(true);
    }
  });

  Object.assign(FE.DEFAULTS, {
    fontFamily: {
      'Arial,Helvetica,sans-serif': 'Arial',
      'Georgia,serif': 'Georgia',
      'Impact,Charcoal,sans-serif': 'Impact',
      'Tahoma,Geneva,sans-serif': 'Tahoma',
      'Times New Roman,Times,serif,-webkit-standard': 'Times New Roman',
      'Verdana,Geneva,sans-serif': 'Verdana'
    },
    fontFamilySelection: false,
    fontFamilyDefaultSelection: 'Font Family'
  });

  FE.PLUGINS.fontFamily = function (editor) {
    var $ = editor.$;

    function apply(val) {
      editor.format.applyStyle('font-family', val);
    }

    function refreshOnShow($btn, $dropdown) {
      $dropdown.find('.fr-command.fr-active').removeClass('fr-active').attr('aria-selected', false);
      $dropdown.find('.fr-command[data-param1="' + _getSelection() + '"]').addClass('fr-active').attr('aria-selected', true);
    }

    function _getArray(val) {
      var font_array = val.replace(/(sans-serif|serif|monospace|cursive|fantasy)/gi, '').replace(/"|'| /g, '').split(',');
      return $(this).grep(font_array, function (txt) {
        return txt.length > 0;
      });
    }
    /**
     * Return first match position.
     */


    function _matches(array1, array2) {
      for (var i = 0; i < array1.length; i++) {
        for (var j = 0; j < array2.length; j++) {
          if (array1[i].toLowerCase() === array2[j].toLowerCase()) {
            return [i, j];
          }
        }
      }

      return null;
    }

    function _getSelection() {
      var val = $(editor.selection.element()).css('font-family');

      var font_array = _getArray(val);

      var font_matches = [];

      for (var key in editor.opts.fontFamily) {
        if (editor.opts.fontFamily.hasOwnProperty(key)) {
          var c_font_array = _getArray(key);

          var match = _matches(font_array, c_font_array);

          if (match) {
            font_matches.push([key, match]);
          }
        }
      }

      if (font_matches.length === 0) return null; // Sort matches by their position.
      // Times,Arial should be detected as being Times, not Arial.

      font_matches.sort(function (a, b) {
        var f_diff = a[1][0] - b[1][0];

        if (f_diff === 0) {
          return a[1][1] - b[1][1];
        } else {
          return f_diff;
        }
      });
      return font_matches[0][0];
    }

    function refresh($btn) {
      if (editor.opts.fontFamilySelection) {
        var val = $(editor.selection.element()).css('font-family').replace(/(sans-serif|serif|monospace|cursive|fantasy)/gi, '').replace(/"|'|/g, '').split(',');
        $btn.find('> span').text(editor.opts.fontFamily[_getSelection()] || val[0] || editor.language.translate(editor.opts.fontFamilyDefaultSelection));
      }
    }

    return {
      apply: apply,
      refreshOnShow: refreshOnShow,
      refresh: refresh
    };
  }; // Register the font size command.


  FE.RegisterCommand('fontFamily', {
    type: 'dropdown',
    displaySelection: function displaySelection(editor) {
      return editor.opts.fontFamilySelection;
    },
    defaultSelection: function defaultSelection(editor) {
      return editor.opts.fontFamilyDefaultSelection;
    },
    displaySelectionWidth: 120,
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = this.opts.fontFamily;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          c += '<li role="presentation"><a class="fr-command" tabIndex="-1" role="option" data-cmd="fontFamily" data-param1="' + val + '" style="font-family: ' + val + '" title="' + options[val] + '">' + options[val] + '</a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    title: 'Font Family',
    callback: function callback(cmd, val) {
      this.fontFamily.apply(val);
    },
    refresh: function refresh($btn) {
      this.fontFamily.refresh($btn);
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      this.fontFamily.refreshOnShow($btn, $dropdown);
    },
    plugin: 'fontFamily'
  }); // Add the font size icon.

  FE.DefineIcon('fontFamily', {
    NAME: 'font',
    SVG_KEY: 'fontFamily'
  });

  Object.assign(FE.DEFAULTS, {
    fontSize: ['8', '9', '10', '11', '12', '14', '18', '24', '30', '36', '48', '60', '72', '96'],
    fontSizeSelection: false,
    fontSizeDefaultSelection: '12',
    fontSizeUnit: 'px'
  });

  FE.PLUGINS.fontSize = function (editor) {
    var $ = editor.$;

    function apply(val) {
      editor.format.applyStyle('font-size', val);
    }

    function refreshOnShow($btn, $dropdown) {
      var val = $(editor.selection.element()).css('font-size');

      if (editor.opts.fontSizeUnit === 'pt') {
        val = Math.round(parseFloat(val, 10) * 72 / 96) + 'pt';
      }

      $dropdown.find('.fr-command.fr-active').removeClass('fr-active').attr('aria-selected', false);
      $dropdown.find('.fr-command[data-param1="' + val + '"]').addClass('fr-active').attr('aria-selected', true);
    }

    function refresh($btn) {
      if (editor.opts.fontSizeSelection) {
        var val = editor.helpers.getPX($(editor.selection.element()).css('font-size'));

        if (editor.opts.fontSizeUnit === 'pt') {
          val = Math.round(parseFloat(val, 10) * 72 / 96) + 'pt';
        }

        $btn.find('> span').text(val);
      }
    }

    return {
      apply: apply,
      refreshOnShow: refreshOnShow,
      refresh: refresh
    };
  }; // Register the font size command.


  FE.RegisterCommand('fontSize', {
    type: 'dropdown',
    title: 'Font Size',
    displaySelection: function displaySelection(editor) {
      return editor.opts.fontSizeSelection;
    },
    displaySelectionWidth: 30,
    defaultSelection: function defaultSelection(editor) {
      return editor.opts.fontSizeDefaultSelection;
    },
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = this.opts.fontSize;

      for (var i = 0; i < options.length; i++) {
        var val = options[i];
        c += '<li role="presentation"><a class="fr-command" tabIndex="-1" role="option" data-cmd="fontSize" data-param1="' + val + this.opts.fontSizeUnit + '" title="' + val + '">' + val + '</a></li>';
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      this.fontSize.apply(val);
    },
    refresh: function refresh($btn) {
      this.fontSize.refresh($btn);
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      this.fontSize.refreshOnShow($btn, $dropdown);
    },
    plugin: 'fontSize'
  }); // Add the font size icon.

  FE.DefineIcon('fontSize', {
    NAME: 'text-height',
    SVG_KEY: 'fontSize'
  });

  Object.assign(FE.POPUP_TEMPLATES, {
    'forms.edit': '[_BUTTONS_]',
    'forms.update': '[_BUTTONS_][_TEXT_LAYER_]'
  }); // Extend defaults.

  Object.assign(FE.DEFAULTS, {
    formEditButtons: ['inputStyle', 'inputEdit'],
    formStyles: {
      'fr-rounded': 'Rounded',
      'fr-large': 'Large'
    },
    formMultipleStyles: true,
    formUpdateButtons: ['inputBack', '|']
  });

  FE.PLUGINS.forms = function (editor) {
    var $ = editor.$;
    var current_input;
    /**
     * Input mousedown.
     */

    function _inputMouseDown(e) {
      e.preventDefault();
      editor.selection.clear();
      $(this).data('mousedown', true);
    }
    /**
     * Mouseup on the input.
     */


    function _inputMouseUp(e) {
      // Mousedown was made.
      if ($(this).data('mousedown')) {
        e.stopPropagation();
        $(this).removeData('mousedown');
        current_input = this;
        showEditPopup(this);
      }

      e.preventDefault();
    }
    /**
     * Cancel if mousedown was made on any input.
     */


    function _cancelSelection() {
      editor.$el.find('input, textarea, button').removeData('mousedown');
    }
    /**
     * Touch move.
     */


    function _inputTouchMove() {
      $(this).removeData('mousedown');
    }
    /**
     * Assign the input events.
     */


    function _bindEvents() {
      editor.events.$on(editor.$el, editor._mousedown, 'input, textarea, button', _inputMouseDown);
      editor.events.$on(editor.$el, editor._mouseup, 'input, textarea, button', _inputMouseUp);
      editor.events.$on(editor.$el, 'touchmove', 'input, textarea, button', _inputTouchMove);
      editor.events.$on(editor.$el, editor._mouseup, _cancelSelection);
      editor.events.$on(editor.$win, editor._mouseup, _cancelSelection);

      _initUpdatePopup(true);
    }
    /**
     * Get the current button.
     */


    function getInput() {
      if (current_input) return current_input;
      return null;
    }
    /**
     * Init the edit button popup.
     */


    function _initEditPopup() {
      // Button edit buttons.
      var buttons = '';

      if (editor.opts.formEditButtons.length > 0) {
        buttons = "<div class=\"fr-buttons\">".concat(editor.button.buildList(editor.opts.formEditButtons), "</div>");
      }

      var template = {
        buttons: buttons // Set the template in the popup.

      };
      var $popup = editor.popups.create('forms.edit', template);

      if (editor.$wp) {
        editor.events.$on(editor.$wp, 'scroll.link-edit', function () {
          if (getInput() && editor.popups.isVisible('forms.edit')) {
            showEditPopup(getInput());
          }
        });
      }

      return $popup;
    }
    /**
     * Show the edit button popup.
     */


    function showEditPopup(input) {
      var $popup = editor.popups.get('forms.edit');
      if (!$popup) $popup = _initEditPopup();
      current_input = input;
      var $input = $(input);
      editor.popups.refresh('forms.edit');
      editor.popups.setContainer('forms.edit', editor.$sc);
      var left = $input.offset().left + $input.outerWidth() / 2;
      var top = $input.offset().top + $input.outerHeight();
      editor.popups.show('forms.edit', left, top, $input.outerHeight());
    }
    /**
     * Refresh update button popup callback.
     */


    function _refreshUpdateCallback() {
      var $popup = editor.popups.get('forms.update');
      var input = getInput();

      if (input) {
        var $input = $(input);

        if ($input.is('button')) {
          $popup.find('input[type="text"][name="text"]').val($input.text());
        } else {
          $popup.find('input[type="text"][name="text"]').val($input.attr('placeholder'));
        }
      }

      $popup.find('input[type="text"][name="text"]').trigger('change');
    }
    /**
     * Hide update button popup callback.
     */


    function _hideUpdateCallback() {
      current_input = null;
    }
    /**
     * Init update button popup.
     */


    function _initUpdatePopup(delayed) {
      if (delayed) {
        editor.popups.onRefresh('forms.update', _refreshUpdateCallback);
        editor.popups.onHide('forms.update', _hideUpdateCallback);
        return true;
      } // Button update buttons.


      var buttons = '';

      if (editor.opts.formUpdateButtons.length >= 1) {
        buttons = "<div class=\"fr-buttons\">".concat(editor.button.buildList(editor.opts.formUpdateButtons), "</div>");
      }

      var text_layer = '';
      var tab_idx = 0;
      text_layer = "<div class=\"fr-forms-text-layer fr-layer fr-active\"> \n    <div class=\"fr-input-line\"><input name=\"text\" type=\"text\" placeholder=\"Text\" tabIndex=\" ".concat(++tab_idx, " \"></div>\n    <div class=\"fr-action-buttons\"><button class=\"fr-command fr-submit\" data-cmd=\"updateInput\" href=\"#\" tabIndex=\"").concat(++tab_idx, "\" type=\"button\">").concat(editor.language.translate('Update'), "</button></div></div>");
      var template = {
        buttons: buttons,
        text_layer: text_layer // Set the template in the popup.

      };
      var $popup = editor.popups.create('forms.update', template);
      return $popup;
    }
    /**
     * Show the button update popup.
     */


    function showUpdatePopup() {
      var input = getInput();

      if (input) {
        var $input = $(input);
        var $popup = editor.popups.get('forms.update');
        if (!$popup) $popup = _initUpdatePopup();

        if (!editor.popups.isVisible('forms.update')) {
          editor.popups.refresh('forms.update');
        }

        editor.popups.setContainer('forms.update', editor.$sc);
        var left = $input.offset().left + $input.outerWidth() / 2;
        var top = $input.offset().top + $input.outerHeight();
        editor.popups.show('forms.update', left, top, $input.outerHeight());
      }
    }
    /**
     * Apply specific style.
     */


    function applyStyle(val, formStyles, multipleStyles) {
      if (typeof formStyles === 'undefined') formStyles = editor.opts.formStyles;
      if (typeof multipleStyles === 'undefined') multipleStyles = editor.opts.formMultipleStyles;
      var input = getInput();
      if (!input) return false; // Remove multiple styles.

      if (!multipleStyles) {
        var styles = Object.keys(formStyles);
        styles.splice(styles.indexOf(val), 1);
        $(input).removeClass(styles.join(' '));
      }

      $(input).toggleClass(val);
    }
    /**
     * Back button in update button popup.
     */


    function back() {
      editor.events.disableBlur();
      editor.selection.restore();
      editor.events.enableBlur();
      var input = getInput();

      if (input && editor.$wp) {
        if (input.tagName === 'BUTTON') editor.selection.restore();
        showEditPopup(input);
      }
    }
    /**
     * Hit the update button in the input popup.
     */


    function updateInput() {
      var $popup = editor.popups.get('forms.update');
      var input = getInput();

      if (input) {
        var $input = $(input);
        var val = $popup.find('input[type="text"][name="text"]').val() || '';

        if (val.length) {
          if ($input.is('button')) {
            $input.text(val);
          } else {
            $input.attr('placeholder', val);
          }
        }

        editor.popups.hide('forms.update');
        showEditPopup(input);
      }
    }
    /**
     * Initialize.
     */


    function _init() {
      // Bind input events.
      _bindEvents(); // Prevent form submit.


      editor.events.$on(editor.$el, 'submit', 'form', function (e) {
        e.preventDefault();
        return false;
      });
    }

    return {
      _init: _init,
      updateInput: updateInput,
      getInput: getInput,
      applyStyle: applyStyle,
      showUpdatePopup: showUpdatePopup,
      showEditPopup: showEditPopup,
      back: back
    };
  }; // Register command to update input.


  FE.RegisterCommand('updateInput', {
    undo: false,
    focus: false,
    title: 'Update',
    callback: function callback() {
      this.forms.updateInput();
    }
  }); // Link styles.

  FE.DefineIcon('inputStyle', {
    NAME: 'magic',
    SVG_KEY: 'inlineStyle'
  });
  FE.RegisterCommand('inputStyle', {
    title: 'Style',
    type: 'dropdown',
    html: function html() {
      var c = '<ul class="fr-dropdown-list">';
      var options = this.opts.formStyles;

      for (var cls in options) {
        if (options.hasOwnProperty(cls)) {
          c += "<li><a class=\"fr-command\" tabIndex=\"-1\" data-cmd=\"inputStyle\" data-param1=\"".concat(cls, "\">").concat(this.language.translate(options[cls]), "</a></li>");
        }
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      var input = this.forms.getInput();

      if (input) {
        this.forms.applyStyle(val);
        this.forms.showEditPopup(input);
      }
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      var $ = this.$;
      var input = this.forms.getInput();

      if (input) {
        var $input = $(input);
        $dropdown.find('.fr-command').each(function () {
          var cls = $(this).data('param1');
          $(this).toggleClass('fr-active', $input.hasClass(cls));
        });
      }
    }
  });
  FE.DefineIcon('inputEdit', {
    NAME: 'edit'
  });
  FE.RegisterCommand('inputEdit', {
    title: 'Edit Button',
    undo: false,
    refreshAfterCallback: false,
    callback: function callback() {
      this.forms.showUpdatePopup();
    }
  });
  FE.DefineIcon('inputBack', {
    NAME: 'arrow-left',
    SVG_KEY: 'back'
  });
  FE.RegisterCommand('inputBack', {
    title: 'Back',
    undo: false,
    focus: false,
    back: true,
    refreshAfterCallback: false,
    callback: function callback() {
      this.forms.back();
    }
  }); // Register command to update button.

  FE.RegisterCommand('updateInput', {
    undo: false,
    focus: false,
    title: 'Update',
    callback: function callback() {
      this.forms.updateInput();
    }
  });

  FE.PLUGINS.fullscreen = function (editor) {
    var $ = editor.$;
    var old_scroll;
    /**
     * Check if fullscreen mode is active.
     */

    function isActive() {
      return editor.$box.hasClass('fr-fullscreen');
    }
    /**
     * Turn fullscreen on.
     */


    var height;
    var max_height;
    var z_index;

    function _on() {
      if (editor.helpers.isIOS() && editor.core.hasFocus()) {
        editor.$el.blur();
        setTimeout(toggle, 250);
        return false;
      }

      old_scroll = editor.helpers.scrollTop();
      editor.$box.toggleClass('fr-fullscreen');
      $('body').first().toggleClass('fr-fullscreen');

      if (editor.helpers.isMobile()) {
        editor.$tb.data('parent', editor.$tb.parent());
        editor.$box.prepend(editor.$tb);

        if (editor.$tb.data('sticky-dummy')) {
          editor.$tb.after(editor.$tb.data('sticky-dummy'));
        }
      }

      height = editor.opts.height;
      max_height = editor.opts.heightMax;
      z_index = editor.opts.zIndex; // Take second toolbar into consideration when in fullscreen mode

      editor.opts.height = editor.o_win.innerHeight - (editor.opts.toolbarInline ? 0 : editor.$tb.outerHeight() + (editor.$second_tb ? editor.$second_tb.outerHeight() : 0));
      editor.opts.zIndex = 2147483641;
      editor.opts.heightMax = null;
      editor.size.refresh();
      if (editor.opts.toolbarInline) editor.toolbar.showInline();
      var $parent_node = editor.$box.parent();

      while (!$parent_node.first().is('body')) {
        $parent_node.addClass('fr-fullscreen-wrapper');
        $parent_node = $parent_node.parent();
      }

      if (editor.opts.toolbarContainer) {
        editor.$box.prepend(editor.$tb);
      }

      editor.events.trigger('charCounter.update');
      editor.events.trigger('codeView.update');
      editor.$win.trigger('scroll');
    }
    /**
     * Turn fullscreen off.
     */


    function _off() {
      if (editor.helpers.isIOS() && editor.core.hasFocus()) {
        editor.$el.blur();
        setTimeout(toggle, 250);
        return false;
      }

      editor.$box.toggleClass('fr-fullscreen');
      $('body').first().toggleClass('fr-fullscreen');

      if (editor.$tb.data('parent')) {
        editor.$tb.data('parent').prepend(editor.$tb);
      }

      if (editor.$tb.data('sticky-dummy')) {
        editor.$tb.after(editor.$tb.data('sticky-dummy'));
      }

      editor.opts.height = height;
      editor.opts.heightMax = max_height;
      editor.opts.zIndex = z_index;
      editor.size.refresh();
      $(editor.o_win).scrollTop(old_scroll);
      if (editor.opts.toolbarInline) editor.toolbar.showInline();
      editor.events.trigger('charCounter.update');

      if (editor.opts.toolbarSticky) {
        if (editor.opts.toolbarStickyOffset) {
          if (editor.opts.toolbarBottom) {
            editor.$tb.css('bottom', editor.opts.toolbarStickyOffset).data('bottom', editor.opts.toolbarStickyOffset);
          } else {
            editor.$tb.css('top', editor.opts.toolbarStickyOffset).data('top', editor.opts.toolbarStickyOffset);
          }
        }
      }

      var $parent_node = editor.$box.parent();

      while (!$parent_node.first().is('body')) {
        $parent_node.removeClass('fr-fullscreen-wrapper');
        $parent_node = $parent_node.parent();
      }

      if (editor.opts.toolbarContainer) {
        $(editor.opts.toolbarContainer).append(editor.$tb);
      }

      $(editor.o_win).trigger('scroll');
      editor.events.trigger('codeView.update');
    }
    /**
     * Exec fullscreen.
     */


    function toggle() {
      if (!isActive()) {
        _on();
      } else {
        _off();
      }

      refresh(editor.$tb.find('.fr-command[data-cmd="fullscreen"]'));
      var moreText = editor.$tb.find('.fr-command[data-cmd="moreText"]');
      var moreParagraph = editor.$tb.find('.fr-command[data-cmd="moreParagraph"]');
      var moreRich = editor.$tb.find('.fr-command[data-cmd="moreRich"]');
      var moreMisc = editor.$tb.find('.fr-command[data-cmd="moreMisc"]'); // Refresh the more button toolbars on fullscreen toggle for repositioning 

      moreText.length && editor.refresh.moreText(moreText);
      moreParagraph.length && editor.refresh.moreParagraph(moreParagraph);
      moreRich.length && editor.refresh.moreRich(moreRich);
      moreMisc.length && editor.refresh.moreMisc(moreMisc);
    }

    function refresh($btn) {
      var active = isActive();
      $btn.toggleClass('fr-active', active).attr('aria-pressed', active);
      $btn.find('> *').not('.fr-sr-only').replaceWith(!active ? editor.icon.create('fullscreen') : editor.icon.create('fullscreenCompress'));
    }

    function _init() {
      if (!editor.$wp) return false;
      editor.events.$on($(editor.o_win), 'resize', function () {
        if (isActive()) {
          _off();

          _on();
        }
      });
      editor.events.on('toolbar.hide', function () {
        if (isActive() && editor.helpers.isMobile()) return false;
      });
      editor.events.on('position.refresh', function () {
        if (editor.helpers.isIOS()) {
          return !isActive();
        }
      });
      editor.events.on('destroy', function () {
        // Exit full screen.
        if (isActive()) {
          _off();
        }
      }, true);
    }

    return {
      _init: _init,
      toggle: toggle,
      refresh: refresh,
      isActive: isActive
    };
  }; // Register the font size command.


  FE.RegisterCommand('fullscreen', {
    title: 'Fullscreen',
    undo: false,
    focus: false,
    accessibilityFocus: true,
    forcedRefresh: true,
    toggle: true,
    callback: function callback() {
      this.fullscreen.toggle();
    },
    refresh: function refresh($btn) {
      this.fullscreen.refresh($btn);
    },
    plugin: 'fullscreen'
  }); // Add the font size icon.

  FE.DefineIcon('fullscreen', {
    NAME: 'expand',
    SVG_KEY: 'fullscreen'
  });
  FE.DefineIcon('fullscreenCompress', {
    NAME: 'compress',
    SVG_KEY: 'exitFullscreen'
  });

  Object.assign(FE.DEFAULTS, {
    helpSets: [{
      title: 'Inline Editor',
      commands: [{
        val: 'OSkeyE',
        desc: 'Show the editor'
      }]
    }, {
      title: 'Common actions',
      commands: [{
        val: 'OSkeyC',
        desc: 'Copy'
      }, {
        val: 'OSkeyX',
        desc: 'Cut'
      }, {
        val: 'OSkeyV',
        desc: 'Paste'
      }, {
        val: 'OSkeyZ',
        desc: 'Undo'
      }, {
        val: 'OSkeyShift+Z',
        desc: 'Redo'
      }, {
        val: 'OSkeyK',
        desc: 'Insert Link'
      }, {
        val: 'OSkeyP',
        desc: 'Insert Image'
      }]
    }, {
      title: 'Basic Formatting',
      commands: [{
        val: 'OSkeyA',
        desc: 'Select All'
      }, {
        val: 'OSkeyB',
        desc: 'Bold'
      }, {
        val: 'OSkeyI',
        desc: 'Italic'
      }, {
        val: 'OSkeyU',
        desc: 'Underline'
      }, {
        val: 'OSkeyS',
        desc: 'Strikethrough'
      }, {
        val: 'OSkey]',
        desc: 'Increase Indent'
      }, {
        val: 'OSkey[',
        desc: 'Decrease Indent'
      }]
    }, {
      title: 'Quote',
      commands: [{
        val: 'OSkey\'',
        desc: 'Increase quote level'
      }, {
        val: 'OSkeyShift+\'',
        desc: 'Decrease quote level'
      }]
    }, {
      title: 'Image / Video',
      commands: [{
        val: 'OSkey+',
        desc: 'Resize larger'
      }, {
        val: 'OSkey-',
        desc: 'Resize smaller'
      }]
    }, {
      title: 'Table',
      commands: [{
        val: 'Alt+Space',
        desc: 'Select table cell'
      }, {
        val: 'Shift+Left/Right arrow',
        desc: 'Extend selection one cell'
      }, {
        val: 'Shift+Up/Down arrow',
        desc: 'Extend selection one row'
      }]
    }, {
      title: 'Navigation',
      commands: [{
        val: 'OSkey/',
        desc: 'Shortcuts'
      }, {
        val: 'Alt+F10',
        desc: 'Focus popup / toolbar'
      }, {
        val: 'Esc',
        desc: 'Return focus to previous position'
      }]
    }]
  });

  FE.PLUGINS.help = function (editor) {
    var $ = editor.$;
    var $modal;
    var modal_id = 'help';
    /*
     * Init Help.
     */

    function _init() {}
    /*
     * Build html body.
     */


    function _buildBody() {
      // Begin body.
      var body = '<div class="fr-help-modal">';

      for (var i = 0; i < editor.opts.helpSets.length; i++) {
        var set = editor.opts.helpSets[i]; // Set shortcuts table.
        // Begin Table.

        var group = '<table>'; // Set title.

        group += '<thead><tr><th>' + editor.language.translate(set.title) + '</th></tr></thead>';
        group += '<tbody>'; // Build commands table.

        for (var j = 0; j < set.commands.length; j++) {
          var command = set.commands[j];
          group += '<tr>';
          group += '<td>' + editor.language.translate(command.desc) + '</td>';
          group += '<td>' + command.val.replace('OSkey', editor.helpers.isMac() ? '&#8984;' : 'Ctrl+') + '</td>';
          group += '</tr>';
        } // End table.


        group += '</tbody></table>'; // Append group to body.

        body += group;
      } // End body.


      body += '</div>';
      return body;
    }
    /*
     * Show help.
     */


    function show() {
      if (!$modal) {
        var head = '<h4>' + editor.language.translate('Shortcuts') + '</h4>';

        var body = _buildBody();

        var modalHash = editor.modals.create(modal_id, head, body);
        $modal = modalHash.$modal; // Resize help modal on window resize.

        editor.events.$on($(editor.o_win), 'resize', function () {
          editor.modals.resize(modal_id);
        });
      } // Show modal.


      editor.modals.show(modal_id); // Modal may not fit window size.

      editor.modals.resize(modal_id);
    }
    /*
     * Hide help.
     */


    function hide() {
      editor.modals.hide(modal_id);
    }

    return {
      _init: _init,
      show: show,
      hide: hide
    };
  };

  FE.DefineIcon('help', {
    NAME: 'question',
    SVG_KEY: 'help'
  });
  FE.RegisterShortcut(FE.KEYCODE.SLASH, 'help', null, '/');
  FE.RegisterCommand('help', {
    title: 'Help',
    icon: 'help',
    undo: false,
    focus: false,
    modal: true,
    callback: function callback() {
      this.help.show();
    },
    plugin: 'help',
    showOnMobile: false
  });

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  Object.assign(FE.POPUP_TEMPLATES, {
    'image.insert': '[_BUTTONS_][_UPLOAD_LAYER_][_BY_URL_LAYER_][_PROGRESS_BAR_]',
    'image.edit': '[_BUTTONS_]',
    'image.alt': '[_BUTTONS_][_ALT_LAYER_]',
    'image.size': '[_BUTTONS_][_SIZE_LAYER_]'
  });
  Object.assign(FE.DEFAULTS, {
    imageInsertButtons: ['imageBack', '|', 'imageUpload', 'imageByURL'],
    imageEditButtons: ['imageReplace', 'imageAlign', 'imageCaption', 'imageRemove', 'imageLink', 'linkOpen', 'linkEdit', 'linkRemove', '-', 'imageDisplay', 'imageStyle', 'imageAlt', 'imageSize'],
    imageAltButtons: ['imageBack', '|'],
    imageSizeButtons: ['imageBack', '|'],
    imageUpload: true,
    imageUploadURL: null,
    imageCORSProxy: 'https://cors-anywhere.froala.com',
    imageUploadRemoteUrls: true,
    imageUploadParam: 'file',
    imageUploadParams: {},
    imageUploadToS3: false,
    imageUploadMethod: 'POST',
    imageMaxSize: 10 * 1024 * 1024,
    imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    imageResize: true,
    imageResizeWithPercent: false,
    imageRoundPercent: false,
    imageDefaultWidth: 300,
    imageDefaultAlign: 'center',
    imageDefaultDisplay: 'block',
    imageSplitHTML: false,
    imageStyles: {
      'fr-rounded': 'Rounded',
      'fr-bordered': 'Bordered',
      'fr-shadow': 'Shadow'
    },
    imageMove: true,
    imageMultipleStyles: true,
    imageTextNear: true,
    imagePaste: true,
    imagePasteProcess: false,
    imageMinWidth: 16,
    imageOutputSize: false,
    imageDefaultMargin: 5,
    imageAddNewLine: false
  });

  FE.PLUGINS.image = function (editor) {
    var $ = editor.$;
    var DEFAULT_IMAGE_UPLOAD_URL = 'https://i.froala.com/upload';
    var $current_image;
    var $image_resizer;
    var $handler;
    var $overlay;
    var mousedown = false;
    var BAD_LINK = 1;
    var MISSING_LINK = 2;
    var ERROR_DURING_UPLOAD = 3;
    var BAD_RESPONSE = 4;
    var MAX_SIZE_EXCEEDED = 5;
    var BAD_FILE_TYPE = 6;
    var NO_CORS_IE = 7;
    var CORRUPTED_IMAGE = 8;
    var error_messages = {};
    error_messages[BAD_LINK] = 'Image cannot be loaded from the passed link.', error_messages[MISSING_LINK] = 'No link in upload response.', error_messages[ERROR_DURING_UPLOAD] = 'Error during file upload.', error_messages[BAD_RESPONSE] = 'Parsing response failed.', error_messages[MAX_SIZE_EXCEEDED] = 'File is too large.', error_messages[BAD_FILE_TYPE] = 'Image file type is invalid.', error_messages[NO_CORS_IE] = 'Files can be uploaded only to same domain in IE 8 and IE 9.';
    error_messages[CORRUPTED_IMAGE] = 'Image file is corrupted.';
    /**
     * Refresh the image insert popup.
     */

    function _refreshInsertPopup() {
      var $popup = editor.popups.get('image.insert');
      var $url_input = $popup.find('.fr-image-by-url-layer input');
      $url_input.val('');

      if ($current_image) {
        $url_input.val($current_image.attr('src'));
      }

      $url_input.trigger('change');
    }
    /**
     * Show the image upload popup.
     */


    function showInsertPopup() {
      var $btn = editor.$tb.find('.fr-command[data-cmd="insertImage"]');
      var $popup = editor.popups.get('image.insert');
      if (!$popup) $popup = _initInsertPopup();
      hideProgressBar();

      if (!$popup.hasClass('fr-active')) {
        editor.popups.refresh('image.insert');
        editor.popups.setContainer('image.insert', editor.$tb);

        if ($btn.isVisible()) {
          var _editor$button$getPos = editor.button.getPosition($btn),
              left = _editor$button$getPos.left,
              top = _editor$button$getPos.top;

          editor.popups.show('image.insert', left, top, $btn.outerHeight());
        } else {
          editor.position.forSelection($popup);
          editor.popups.show('image.insert');
        }
      }
    }
    /**
     * Show the image edit popup.
     */


    function _showEditPopup() {
      var $popup = editor.popups.get('image.edit');
      if (!$popup) $popup = _initEditPopup();

      if ($popup) {
        var $el = getEl();

        if (hasCaption()) {
          $el = $el.find('.fr-img-wrap');
        }

        editor.popups.setContainer('image.edit', editor.$sc);
        editor.popups.refresh('image.edit');
        var left = $el.offset().left + $el.outerWidth() / 2;
        var top = $el.offset().top + $el.outerHeight(); // Enhancement 2950

        if ($current_image.hasClass('fr-uploading')) {
          showProgressBar();
        } else {
          editor.popups.show('image.edit', left, top, $el.outerHeight(), true);
        }
      }
    }
    /**
     * Hide image upload popup.
     */


    function _hideInsertPopup() {
      hideProgressBar();
    }
    /**
     * Convert style to classes.
     */


    function _convertStyleToClasses($img) {
      if ($img.parents('.fr-img-caption').length > 0) {
        $img = $img.parents('.fr-img-caption').first();
      }

      if (!$img.hasClass('fr-dii') && !$img.hasClass('fr-dib')) {
        $img.addClass('fr-fi' + getAlign($img)[0]);
        $img.addClass('fr-di' + getDisplay($img)[0]); // Reset inline style.

        $img.css('margin', '');
        $img.css('float', '');
        $img.css('display', '');
        $img.css('z-index', '');
        $img.css('position', '');
        $img.css('overflow', '');
        $img.css('vertical-align', '');
      }
    }
    /**
     * Convert classes to style.
     */


    function _convertClassesToStyle($img) {
      if ($img.parents('.fr-img-caption').length > 0) {
        $img = $img.parents('.fr-img-caption').first();
      }

      var d = $img.hasClass('fr-dib') ? 'block' : $img.hasClass('fr-dii') ? 'inline' : null;
      var a = $img.hasClass('fr-fil') ? 'left' : $img.hasClass('fr-fir') ? 'right' : getAlign($img);

      _setStyle($img, d, a);

      $img.removeClass('fr-dib fr-dii fr-fir fr-fil');
    }
    /**
     * Refresh the image list.
     */


    function _refreshImageList() {
      var images = editor.el.tagName == 'IMG' ? [editor.el] : editor.el.querySelectorAll('img');

      for (var i = 0; i < images.length; i++) {
        var $img = $(images[i]);

        if (!editor.opts.htmlUntouched && editor.opts.useClasses) {
          if (editor.opts.imageDefaultAlign || editor.opts.imageDefaultDisplay) {
            _convertStyleToClasses($img);
          } // Do not allow text near image.


          if (!editor.opts.imageTextNear) {
            if ($img.parents('.fr-img-caption').length > 0) {
              $img.parents('.fr-img-caption').first().removeClass('fr-dii').addClass('fr-dib');
            } else {
              $img.removeClass('fr-dii').addClass('fr-dib');
            }
          }
        } else if (!editor.opts.htmlUntouched && !editor.opts.useClasses) {
          if (editor.opts.imageDefaultAlign || editor.opts.imageDefaultDisplay) {
            _convertClassesToStyle($img);
          }
        }

        if (editor.opts.iframe) {
          $img.on('load', editor.size.syncIframe);
        }
      }
    }
    /**
     * Keep images in sync when content changed.
     */


    var images;

    function _syncImages(loaded) {
      if (typeof loaded === 'undefined') loaded = true; // Get current images.

      var c_images = Array.prototype.slice.call(editor.el.querySelectorAll('img')); // Current images src.

      var image_srcs = [];
      var i;

      for (i = 0; i < c_images.length; i++) {
        image_srcs.push(c_images[i].getAttribute('src'));
        $(c_images[i]).toggleClass('fr-draggable', editor.opts.imageMove);
        if (c_images[i].getAttribute('class') === '') c_images[i].removeAttribute('class');
        if (c_images[i].getAttribute('style') === '') c_images[i].removeAttribute('style');

        if (c_images[i].parentNode && c_images[i].parentNode.parentNode && editor.node.hasClass(c_images[i].parentNode.parentNode, 'fr-img-caption')) {
          var p_node = c_images[i].parentNode.parentNode;

          if (!editor.browser.mozilla) {
            p_node.setAttribute('contenteditable', false);
          }

          p_node.setAttribute('draggable', false);
          p_node.classList.add('fr-draggable');
          var n_node = c_images[i].nextSibling;

          if (n_node && !editor.browser.mozilla) {
            n_node.setAttribute('contenteditable', true);
          }
        }
      } // Loop previous images and check their src.


      if (images) {
        for (i = 0; i < images.length; i++) {
          if (image_srcs.indexOf(images[i].getAttribute('src')) < 0) {
            editor.events.trigger('image.removed', [$(images[i])]);
          }
        }
      } // Loop new images and see which were not int the old ones.


      if (images && loaded) {
        var old_images_srcs = [];

        for (i = 0; i < images.length; i++) {
          old_images_srcs.push(images[i].getAttribute('src'));
        }

        for (i = 0; i < c_images.length; i++) {
          if (old_images_srcs.indexOf(c_images[i].getAttribute('src')) < 0) {
            editor.events.trigger('image.loaded', [$(c_images[i])]);
          }
        }
      } // Current images are the old ones.


      images = c_images;
    }
    /**
     * Reposition resizer.
     */


    function _repositionResizer() {
      if (!$image_resizer) _initImageResizer();
      if (!$current_image) return false;
      var $container = editor.$wp || editor.$sc;
      $container.append($image_resizer);
      $image_resizer.data('instance', editor);
      var wrap_correction_top = $container.scrollTop() - ($container.css('position') != 'static' ? $container.offset().top : 0);
      var wrap_correction_left = $container.scrollLeft() - ($container.css('position') != 'static' ? $container.offset().left : 0);
      wrap_correction_left -= editor.helpers.getPX($container.css('border-left-width'));
      wrap_correction_top -= editor.helpers.getPX($container.css('border-top-width'));

      if (editor.$el.is('img') && editor.$sc.is('body')) {
        wrap_correction_top = 0;
        wrap_correction_left = 0;
      }

      var $el = getEl();

      if (hasCaption()) {
        $el = $el.find('.fr-img-wrap');
      }

      var iframePaddingTop = 0;
      var iframePaddingLeft = 0;

      if (editor.opts.iframe) {
        iframePaddingTop = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-top'));
        iframePaddingLeft = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-left'));
      }

      $image_resizer.css('top', (editor.opts.iframe ? $el.offset().top + iframePaddingTop : $el.offset().top + wrap_correction_top) - 1).css('left', (editor.opts.iframe ? $el.offset().left + iframePaddingLeft : $el.offset().left + wrap_correction_left) - 1).css('width', $el.get(0).getBoundingClientRect().width).css('height', $el.get(0).getBoundingClientRect().height).addClass('fr-active');
    }
    /**
     * Create resize handler.
     */


    function _getHandler(pos) {
      return '<div class="fr-handler fr-h' + pos + '"></div>';
    }
    /**
     * Set the image with
     */


    function _setWidth(width) {
      if (hasCaption()) {
        $current_image.parents('.fr-img-caption').css('width', width);
      } else {
        $current_image.css('width', width);
      }
    }
    /**
     * Mouse down to start resize.
     */


    function _handlerMousedown(e) {
      // Check if resizer belongs to current instance.
      if (!editor.core.sameInstance($image_resizer)) return true;
      e.preventDefault();
      e.stopPropagation();
      if (editor.$el.find('img.fr-error').left) return false;
      if (!editor.undo.canDo()) editor.undo.saveStep(); // Get offset.

      var start_x = e.pageX || e.originalEvent.touches[0].pageX; // Only on mousedown. This function could be called from keydown on accessibility.

      if (e.type == 'mousedown') {
        // See if the entire editor is inside iframe to adjust starting offset.
        var oel = editor.$oel.get(0);
        var doc = oel.ownerDocument;
        var win = doc.defaultView || doc.parentWindow;
        var editor_inside_iframe = false;

        try {
          editor_inside_iframe = win.location != win.parent.location && !(win.$ && win.$.FE);
        } catch (ex) {}

        if (editor_inside_iframe && win.frameElement) {
          start_x += editor.helpers.getPX($(win.frameElement).offset().left) + win.frameElement.clientLeft;
        }
      }

      $handler = $(this);
      $handler.data('start-x', start_x);
      $handler.data('start-width', $current_image.width());
      $handler.data('start-height', $current_image.height()); // Set current width.

      var width = $current_image.width(); // Update width value if resizing with percent.

      if (editor.opts.imageResizeWithPercent) {
        var p_node = $current_image.parentsUntil(editor.$el, editor.html.blockTagsQuery()).get(0) || editor.el;
        width = (width / $(p_node).outerWidth() * 100).toFixed(2) + '%';
      } // Set the image width.


      _setWidth(width);

      $overlay.show();
      editor.popups.hideAll();

      _unmarkExit();
    }
    /**
     * Do resize.
     */


    function _handlerMousemove(e) {
      // Check if resizer belongs to current instance.
      if (!editor.core.sameInstance($image_resizer)) return true;
      var real_image_size;

      if ($handler && $current_image) {
        e.preventDefault();
        if (editor.$el.find('img.fr-error').left) return false;
        var c_x = e.pageX || (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : null);
        if (!c_x) return false;
        var s_x = $handler.data('start-x');
        var diff_x = c_x - s_x;
        var width = $handler.data('start-width');

        if ($handler.hasClass('fr-hnw') || $handler.hasClass('fr-hsw')) {
          diff_x = 0 - diff_x;
        }

        if (editor.opts.imageResizeWithPercent) {
          var p_node = $current_image.parentsUntil(editor.$el, editor.html.blockTagsQuery()).get(0) || editor.el;
          width = ((width + diff_x) / $(p_node).outerWidth() * 100).toFixed(2);
          if (editor.opts.imageRoundPercent) width = Math.round(width); // Set the image width.

          _setWidth(width + '%'); // Get the real image width after resize.


          if (hasCaption()) {
            real_image_size = (editor.helpers.getPX($current_image.parents('.fr-img-caption').css('width')) / $(p_node).outerWidth() * 100).toFixed(2);
          } else {
            real_image_size = (editor.helpers.getPX($current_image.css('width')) / $(p_node).outerWidth() * 100).toFixed(2);
          } // If the width is not contained within editor use the real image size.


          if (real_image_size !== width && !editor.opts.imageRoundPercent) {
            _setWidth(real_image_size + '%');
          }

          $current_image.css('height', '').removeAttr('height');
        } else {
          if (width + diff_x >= editor.opts.imageMinWidth) {
            // Set width for image parent node as well.
            _setWidth(width + diff_x); // Get the real image width after resize.


            if (hasCaption()) {
              real_image_size = editor.helpers.getPX($current_image.parents('.fr-img-caption').css('width'));
            } else {
              real_image_size = editor.helpers.getPX($current_image.css('width'));
            }
          } // If the width is not contained within editor use the real image size.


          if (real_image_size !== width + diff_x) {
            _setWidth(real_image_size);
          } // https://github.com/froala/wysiwyg-editor/issues/1963.


          if (($current_image.attr('style') || '').match(/(^height:)|(; *height:)/) || $current_image.attr('height')) {
            $current_image.css('height', $handler.data('start-height') * $current_image.width() / $handler.data('start-width'));
            $current_image.removeAttr('height');
          }
        }

        _repositionResizer();

        editor.events.trigger('image.resize', [get()]);
      }
    }
    /**
     * Stop resize.
     */


    function _handlerMouseup(e) {
      // Check if resizer belongs to current instance.
      if (!editor.core.sameInstance($image_resizer)) return true;

      if ($handler && $current_image) {
        if (e) e.stopPropagation();
        if (editor.$el.find('img.fr-error').left) return false;
        $handler = null;
        $overlay.hide();

        _repositionResizer();

        _showEditPopup();

        editor.undo.saveStep();
        editor.events.trigger('image.resizeEnd', [get()]);
      }
    }
    /**
     * Throw an image error.
     */


    function _throwError(code, response, $img) {
      editor.edit.on();
      if ($current_image) $current_image.addClass('fr-error'); // https://github.com/froala/wysiwyg-editor/issues/3407

      if (error_messages[code]) {
        _showErrorMessage(error_messages[code]);
      } else {
        _showErrorMessage(editor.language.translate('Something went wrong. Please try again.'));
      } // Remove image if it exists.


      if (!$current_image && $img) remove($img);
      editor.events.trigger('image.error', [{
        code: code,
        message: error_messages[code]
      }, response, $img]);
    }
    /**
     * Init the image edit popup.
     */


    function _initEditPopup(delayed) {
      if (delayed) {
        if (editor.$wp) {
          editor.events.$on(editor.$wp, 'scroll.image-edit', function () {
            if ($current_image && editor.popups.isVisible('image.edit')) {
              editor.events.disableBlur();

              _showEditPopup();
            }
          });
        }

        return true;
      } // Image buttons.


      var image_buttons = '';

      if (editor.opts.imageEditButtons.length > 0) {
        image_buttons += "<div class=\"fr-buttons\"> \n        ".concat(editor.button.buildList(editor.opts.imageEditButtons), "\n        </div>");
        var template = {
          buttons: image_buttons
        };
        var $popup = editor.popups.create('image.edit', template);
        return $popup;
      }

      return false;
    }
    /**
     * Show progress bar.
     */


    function showProgressBar(no_message) {
      var $popup = editor.popups.get('image.insert');
      if (!$popup) $popup = _initInsertPopup();
      $popup.find('.fr-layer.fr-active').removeClass('fr-active').addClass('fr-pactive');
      $popup.find('.fr-image-progress-bar-layer').addClass('fr-active');
      $popup.find('.fr-buttons').hide();

      if ($current_image) {
        var $el = getEl();
        editor.popups.setContainer('image.insert', editor.$sc);
        var left = $el.offset().left;
        var top = $el.offset().top + $el.height();
        editor.popups.show('image.insert', left, top, $el.outerHeight());
      }

      if (typeof no_message == 'undefined') {
        _setProgressMessage(editor.language.translate('Uploading'), 0);
      }
    }
    /**
     * Hide progress bar.
     */


    function hideProgressBar(dismiss) {
      var $popup = editor.popups.get('image.insert');

      if ($popup) {
        $popup.find('.fr-layer.fr-pactive').addClass('fr-active').removeClass('fr-pactive');
        $popup.find('.fr-image-progress-bar-layer').removeClass('fr-active');
        $popup.find('.fr-buttons').show(); // Dismiss error message.

        if (dismiss || editor.$el.find('img.fr-error').length) {
          editor.events.focus();

          if (editor.$el.find('img.fr-error').length) {
            editor.$el.find('img.fr-error').remove();
            editor.undo.saveStep();
            editor.undo.run();
            editor.undo.dropRedo();
          }

          if (!editor.$wp && $current_image) {
            var $img = $current_image;

            _exitEdit(true);

            editor.selection.setAfter($img.get(0));
            editor.selection.restore();
          }

          editor.popups.hide('image.insert');
        }
      }
    }
    /**
     * Set a progress message.
     */


    function _setProgressMessage(message, progress) {
      var $popup = editor.popups.get('image.insert');

      if ($popup) {
        var $layer = $popup.find('.fr-image-progress-bar-layer');
        $layer.find('h3').text(message + (progress ? ' ' + progress + '%' : ''));
        $layer.removeClass('fr-error');

        if (progress) {
          $layer.find('div').removeClass('fr-indeterminate');
          $layer.find('div > span').css('width', progress + '%');
        } else {
          $layer.find('div').addClass('fr-indeterminate');
        }
      }
    }
    /**
     * Show error message to the user.
     */


    function _showErrorMessage(message) {
      showProgressBar();
      var $popup = editor.popups.get('image.insert');
      var $layer = $popup.find('.fr-image-progress-bar-layer');
      $layer.addClass('fr-error');
      var $message_header = $layer.find('h3');
      $message_header.text(message);
      editor.events.disableBlur();
      $message_header.focus();
    }
    /**
     * Insert image using URL callback.
     */


    function insertByURL() {
      var $popup = editor.popups.get('image.insert');
      var $input = $popup.find('.fr-image-by-url-layer input');

      if ($input.val().length > 0) {
        showProgressBar();

        _setProgressMessage(editor.language.translate('Loading image'));

        var img_url = $input.val().trim(); // Upload images if we should upload them.

        if (editor.opts.imageUploadRemoteUrls && editor.opts.imageCORSProxy && editor.opts.imageUpload) {
          var xhr = new XMLHttpRequest();

          xhr.onload = function () {
            if (this.status == 200) {
              upload([new Blob([this.response], {
                type: this.response.type || 'image/png'
              })], $current_image);
            } else {
              _throwError(BAD_LINK);
            }
          }; // If image couldn't be uploaded, insert as it is.


          xhr.onerror = function () {
            insert(img_url, true, [], $current_image);
          };

          xhr.open('GET', editor.opts.imageCORSProxy + '/' + img_url, true);
          xhr.responseType = 'blob';
          xhr.send();
        } else {
          insert(img_url, true, [], $current_image);
        }

        $input.val('');
        $input.blur();
      }
    }

    function _editImg($img) {
      _edit.call($img.get(0));
    }

    function _loadedCallback() {
      var $img = $(this);
      editor.popups.hide('image.insert');
      $img.removeClass('fr-uploading'); // Select the image.

      if ($img.next().is('br')) {
        $img.next().remove();
      }

      _editImg($img);

      editor.events.trigger('image.loaded', [$img]);
    }
    /**
     * Insert image into the editor.
     */


    function insert(link, sanitize, data, $existing_img, response) {
      editor.edit.off();

      _setProgressMessage(editor.language.translate('Loading image'));

      if (sanitize) link = editor.helpers.sanitizeURL(link);
      var image = new Image();

      image.onload = function () {
        var $img;
        var attr;

        if ($existing_img) {
          if (!editor.undo.canDo() && !$existing_img.hasClass('fr-uploading')) editor.undo.saveStep();
          var old_src = $existing_img.data('fr-old-src');

          if ($existing_img.data('fr-image-pasted')) {
            old_src = null;
          }

          if (editor.$wp) {
            // Clone existing image.
            $img = $existing_img.clone().removeData('fr-old-src').removeClass('fr-uploading').removeAttr('data-fr-image-pasted'); // Remove load event.

            $img.off('load'); // Set new SRC.

            if (old_src) $existing_img.attr('src', old_src); // Replace existing image with its clone.

            $existing_img.replaceWith($img);
          } else {
            $img = $existing_img;
          } // Remove old data.


          var atts = $img.get(0).attributes;

          for (var i = 0; i < atts.length; i++) {
            var att = atts[i];

            if (att.nodeName.indexOf('data-') === 0) {
              $img.removeAttr(att.nodeName);
            }
          } // Set new data.


          if (typeof data != 'undefined') {
            for (attr in data) {
              if (data.hasOwnProperty(attr)) {
                if (attr != 'link') {
                  $img.attr('data-' + attr, data[attr]);
                }
              }
            }
          }

          $img.on('load', _loadedCallback);
          $img.attr('src', link);
          editor.edit.on();

          _syncImages(false);

          editor.undo.saveStep(); // Cursor will not appear if we don't make blur.

          editor.events.disableBlur();
          editor.$el.blur();
          editor.events.trigger(old_src ? 'image.replaced' : 'image.inserted', [$img, response]);
        } else {
          $img = _addImage(link, data, _loadedCallback);

          _syncImages(false);

          editor.undo.saveStep(); // Cursor will not appear if we don't make blur.

          editor.events.disableBlur();
          editor.$el.blur();
          editor.events.trigger('image.inserted', [$img, response]);
        }
      };

      image.onerror = function () {
        _throwError(BAD_LINK);
      };

      showProgressBar(editor.language.translate('Loading image'));
      image.src = link;
    }
    /**
     * Parse image response.
     */


    function _parseResponse(response) {
      try {
        if (editor.events.trigger('image.uploaded', [response], true) === false) {
          editor.edit.on();
          return false;
        }

        var resp = JSON.parse(response);

        if (resp.link) {
          return resp;
        } else {
          // No link in upload request.
          _throwError(MISSING_LINK, response);

          return false;
        }
      } catch (ex) {
        // Bad response.
        _throwError(BAD_RESPONSE, response);

        return false;
      }
    }
    /**
     * Parse image response.
     */


    function _parseXMLResponse(response) {
      try {
        var link = $(response).find('Location').text();
        var key = $(response).find('Key').text();

        if (editor.events.trigger('image.uploadedToS3', [link, key, response], true) === false) {
          editor.edit.on();
          return false;
        }

        return link;
      } catch (ex) {
        // Bad response.
        _throwError(BAD_RESPONSE, response);

        return false;
      }
    }
    /**
     * Image was uploaded to the server and we have a response.
     */


    function _imageUploaded($img) {
      _setProgressMessage(editor.language.translate('Loading image'));

      var status = this.status;
      var response = this.response;
      var responseXML = this.responseXML;
      var responseText = this.responseText;

      try {
        if (editor.opts.imageUploadToS3) {
          if (status == 201) {
            var link = _parseXMLResponse(responseXML);

            if (link) {
              insert(link, false, [], $img, response || responseXML);
            }
          } else {
            _throwError(BAD_RESPONSE, response || responseXML, $img);
          }
        } else {
          if (status >= 200 && status < 300) {
            var resp = _parseResponse(responseText);

            if (resp) {
              insert(resp.link, false, resp, $img, response || responseText);
            }
          } else {
            _throwError(ERROR_DURING_UPLOAD, response || responseText, $img);
          }
        }
      } catch (ex) {
        // Bad response.
        _throwError(BAD_RESPONSE, response || responseText, $img);
      }
    }
    /**
     * Image upload error.
     */


    function _imageUploadError() {
      _throwError(BAD_RESPONSE, this.response || this.responseText || this.responseXML);
    }
    /**
     * Image upload progress.
     */


    function _imageUploadProgress(e) {
      if (e.lengthComputable) {
        var complete = e.loaded / e.total * 100 | 0;

        _setProgressMessage(editor.language.translate('Uploading'), complete);
      }
    }

    function _addImage(link, data, loadCallback) {
      // Build image data string.
      var data_str = '';
      var attr;
      var $img = $(document.createElement('img')).attr('src', link);

      if (data && typeof data != 'undefined') {
        for (attr in data) {
          if (data.hasOwnProperty(attr)) {
            if (attr != 'link') {
              data_str += ' data-' + attr + '="' + data[attr] + '"';
              $img.attr('data-str' + attr, data[attr]);
            }
          }
        }
      }

      var width = editor.opts.imageDefaultWidth;

      if (width && width != 'auto') {
        width = editor.opts.imageResizeWithPercent ? '100%' : width + 'px';
      } // Create image object and set the load event.


      $img.attr('style', width ? 'width: ' + width + ';' : '');

      _setStyle($img, editor.opts.imageDefaultDisplay, editor.opts.imageDefaultAlign);

      $img.on('load', loadCallback); // Image might be corrupted. Continue upload flow.

      $img.on('error', loadCallback); // Make sure we have focus.
      // Call the event.

      editor.edit.on();
      editor.events.focus(true);
      editor.selection.restore();
      editor.undo.saveStep(); // Insert marker and then replace it with the image.

      if (editor.opts.imageSplitHTML) {
        editor.markers.split();
      } else {
        editor.markers.insert();
      }

      editor.html.wrap();
      var $marker = editor.$el.find('.fr-marker');

      if ($marker.length) {
        // Do not insert image in HR.
        if ($marker.parent().is('hr')) {
          $marker.parent().after($marker);
        } // Do not insert image inside emoticon.


        if (editor.node.isLastSibling($marker) && $marker.parent().hasClass('fr-deletable')) {
          $marker.insertAfter($marker.parent());
        }

        $marker.replaceWith($img);
      } else {
        editor.$el.append($img);
      }

      editor.selection.clear();
      return $img;
    }
    /**
     * Image upload aborted.
     */


    function _imageUploadAborted() {
      editor.edit.on();
      hideProgressBar(true);
    }
    /**
     * Start the uploading process.
     */


    function _startUpload(xhr, form_data, image, $image_placeholder) {
      function _sendRequest() {
        var $img = $(this);
        $img.off('load');
        $img.addClass('fr-uploading');

        if ($img.next().is('br')) {
          $img.next().remove();
        }

        editor.placeholder.refresh(); // Select the image.

        _editImg($img);

        _repositionResizer();

        showProgressBar();
        editor.edit.off(); // Set upload events.

        xhr.onload = function () {
          _imageUploaded.call(xhr, $img);
        };

        xhr.onerror = _imageUploadError;
        xhr.upload.onprogress = _imageUploadProgress;
        xhr.onabort = _imageUploadAborted; // Set abort event.

        $($img.off('abortUpload')).on('abortUpload', function () {
          if (xhr.readyState != 4) {
            xhr.abort();

            if (!$image_placeholder) {
              $img.remove();
            } else {
              $image_placeholder.attr('src', $image_placeholder.data('fr-old-src'));
              $image_placeholder.removeClass('fr-uploading');
            }

            _exitEdit(true);
          }
        }); // Send data.

        xhr.send(form_data);
      }

      var reader = new FileReader();

      reader.onload = function () {
        var link = reader.result;

        if (reader.result.indexOf('svg+xml') < 0) {
          // Convert image to local blob.
          var binary = atob(reader.result.split(',')[1]);
          var array = [];

          for (var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
          } // Get local image link.


          link = window.URL.createObjectURL(new Blob([new Uint8Array(array)], {
            type: 'image/jpeg'
          }));
        } // No image.


        if (!$image_placeholder) {
          _addImage(link, null, _sendRequest);
        } else {
          // https://github.com/froala-labs/froala-editor-js-2/issues/1866
          // Add load event for the image element
          $image_placeholder.get(0).addEventListener('load', _sendRequest); // Image might be corrupted.

          $image_placeholder.on('error', function () {
            _sendRequest();

            $(this).off('error');
          });
          editor.edit.on();
          editor.undo.saveStep();
          $image_placeholder.data('fr-old-src', $image_placeholder.attr('src'));
          $image_placeholder.attr('src', link);
        }
      };

      reader.readAsDataURL(image);
    }

    function _browserUpload(image, $image_placeholder) {
      var reader = new FileReader();

      reader.onload = function () {
        var link = reader.result;

        if (reader.result.indexOf('svg+xml') < 0) {
          // Convert image to local blob.
          var binary = atob(reader.result.split(',')[1]);
          var array = [];

          for (var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
          } // Get local image link.


          link = window.URL.createObjectURL(new Blob([new Uint8Array(array)], {
            type: image.type
          }));
          editor.image.insert(link, false, null, $image_placeholder);
        }
      };

      showProgressBar();
      reader.readAsDataURL(image);
    }
    /**
     * Do image upload.
     */


    function upload(images, $image_placeholder) {
      // Make sure we have what to upload.
      if (typeof images != 'undefined' && images.length > 0) {
        // Check if we should cancel the image upload.
        if (editor.events.trigger('image.beforeUpload', [images, $image_placeholder]) === false) {
          return false;
        }

        var image = images[0]; // Upload as blob for testing purposes.

        if ((editor.opts.imageUploadURL === null || editor.opts.imageUploadURL == DEFAULT_IMAGE_UPLOAD_URL) && !editor.opts.imageUploadToS3) {
          _browserUpload(image, $image_placeholder || $current_image);

          return false;
        } // Check if there is image name set.


        if (!image.name) {
          image.name = new Date().getTime() + '.' + (image.type || 'image/jpeg').replace(/image\//g, '');
        } // Check image max size.


        if (image.size > editor.opts.imageMaxSize) {
          _throwError(MAX_SIZE_EXCEEDED);

          return false;
        } // Check image types.


        if (editor.opts.imageAllowedTypes.indexOf(image.type.replace(/image\//g, '')) < 0) {
          _throwError(BAD_FILE_TYPE);

          return false;
        } // Create form Data.


        var form_data;

        if (editor.drag_support.formdata) {
          form_data = editor.drag_support.formdata ? new FormData() : null;
        } // Prepare form data for request.


        if (form_data) {
          var key; // Upload to S3.

          if (editor.opts.imageUploadToS3 !== false) {
            form_data.append('key', editor.opts.imageUploadToS3.keyStart + new Date().getTime() + '-' + (image.name || 'untitled'));
            form_data.append('success_action_status', '201');
            form_data.append('X-Requested-With', 'xhr');
            form_data.append('Content-Type', image.type);

            for (key in editor.opts.imageUploadToS3.params) {
              if (editor.opts.imageUploadToS3.params.hasOwnProperty(key)) {
                form_data.append(key, editor.opts.imageUploadToS3.params[key]);
              }
            }
          } // Add upload params.


          for (key in editor.opts.imageUploadParams) {
            if (editor.opts.imageUploadParams.hasOwnProperty(key)) {
              form_data.append(key, editor.opts.imageUploadParams[key]);
            }
          } // Set the image in the request.


          form_data.append(editor.opts.imageUploadParam, image, image.name); // Create XHR request.

          var url = editor.opts.imageUploadURL;

          if (editor.opts.imageUploadToS3) {
            if (editor.opts.imageUploadToS3.uploadURL) {
              url = editor.opts.imageUploadToS3.uploadURL;
            } else {
              url = 'https://' + editor.opts.imageUploadToS3.region + '.amazonaws.com/' + editor.opts.imageUploadToS3.bucket;
            }
          }

          var xhr = editor.core.getXHR(url, editor.opts.imageUploadMethod);

          _startUpload(xhr, form_data, image, $image_placeholder || $current_image);
        }
      }
    }
    /**
     * Image drop inside the upload zone.
     */


    function _bindInsertEvents($popup) {
      // Drag over the dropable area.
      editor.events.$on($popup, 'dragover dragenter', '.fr-image-upload-layer', function () {
        $(this).addClass('fr-drop');
        return false;
      }, true); // Drag end.

      editor.events.$on($popup, 'dragleave dragend', '.fr-image-upload-layer', function () {
        $(this).removeClass('fr-drop');
        return false;
      }, true); // Drop.

      editor.events.$on($popup, 'drop', '.fr-image-upload-layer', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('fr-drop');
        var dt = e.originalEvent.dataTransfer;

        if (dt && dt.files) {
          var inst = $popup.data('instance') || editor;
          inst.events.disableBlur();
          inst.image.upload(dt.files);
          inst.events.enableBlur();
        }
      }, true);

      if (editor.helpers.isIOS()) {
        editor.events.$on($popup, 'touchstart', '.fr-image-upload-layer input[type="file"]', function () {
          $(this).trigger('click');
        }, true);
      }

      editor.events.$on($popup, 'change', '.fr-image-upload-layer input[type="file"]', function () {
        if (this.files) {
          var inst = $popup.data('instance') || editor;
          inst.events.disableBlur();
          $popup.find('input:focus').blur();
          inst.events.enableBlur();
          inst.image.upload(this.files, $current_image);
        } // Else IE 9 case.
        // Chrome fix.


        $(this).val('');
      }, true);
    }

    function _beforeElementDrop($el) {
      if ($el.is('img') && $el.parents('.fr-img-caption').length > 0) {
        return $el.parents('.fr-img-caption');
      }
    }

    function _drop(e) {
      // Check if we are dropping files.
      var dt = e.originalEvent.dataTransfer;

      if (dt && dt.files && dt.files.length) {
        var img = dt.files[0];

        if (img && img.type && img.type.indexOf('image') !== -1 && editor.opts.imageAllowedTypes.indexOf(img.type.replace(/image\//g, '')) >= 0) {
          if (!editor.opts.imageUpload) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }

          editor.markers.remove();
          editor.markers.insertAtPoint(e.originalEvent);
          editor.$el.find('.fr-marker').replaceWith(FE.MARKERS);

          if (editor.$el.find('.fr-marker').length === 0) {
            editor.selection.setAtEnd(editor.el);
          } // Hide popups.


          editor.popups.hideAll(); // Show the image insert popup.

          var $popup = editor.popups.get('image.insert');
          if (!$popup) $popup = _initInsertPopup();
          editor.popups.setContainer('image.insert', editor.$sc);
          var left = e.originalEvent.pageX;
          var top = e.originalEvent.pageY;

          if (editor.opts.iframe) {
            var iframePaddingTop = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-top'));
            var iframePaddingLeft = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-left'));
            top += editor.$iframe.offset().top + iframePaddingTop;
            left += editor.$iframe.offset().left + iframePaddingLeft;
          }

          editor.popups.show('image.insert', left, top);
          showProgressBar(); // Dropped file is an image that we allow.

          if (editor.opts.imageAllowedTypes.indexOf(img.type.replace(/image\//g, '')) >= 0) {
            // Image might be selected.
            _exitEdit(true); // Upload images.


            upload(dt.files);
          } else {
            _throwError(BAD_FILE_TYPE);
          } // Cancel anything else.


          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    }

    function _initEvents() {
      // Mouse down on image. It might start move.
      editor.events.$on(editor.$el, editor._mousedown, editor.el.tagName == 'IMG' ? null : 'img:not([contenteditable="false"])', function (e) {
        if ($(this).parents('contenteditable').not('.fr-element').not('.fr-img-caption').not('body').first().attr('contenteditable') == 'false') return true;
        if (!editor.helpers.isMobile()) editor.selection.clear();
        mousedown = true;
        if (editor.popups.areVisible()) editor.events.disableBlur(); // Prevent the image resizing.

        if (editor.browser.msie) {
          editor.events.disableBlur();
          editor.$el.attr('contenteditable', false);
        }

        if (!editor.draggable && e.type != 'touchstart') e.preventDefault();
        e.stopPropagation();
      });
      editor.events.$on(editor.$el, editor._mousedown, '.fr-img-caption .fr-inner', function (e) {
        if (!editor.core.hasFocus()) {
          editor.events.focus();
        }

        e.stopPropagation();
      });
      editor.events.$on(editor.$el, 'paste', '.fr-img-caption .fr-inner', function (e) {
        editor.toolbar.hide();
        e.stopPropagation();
      }); // Mouse up on an image prevent move.

      editor.events.$on(editor.$el, editor._mouseup, editor.el.tagName == 'IMG' ? null : 'img:not([contenteditable="false"])', function (e) {
        if ($(this).parents('contenteditable').not('.fr-element').not('.fr-img-caption').not('body').first().attr('contenteditable') == 'false') return true;

        if (mousedown) {
          mousedown = false; // Remove moving class.

          e.stopPropagation();

          if (editor.browser.msie) {
            editor.$el.attr('contenteditable', true);
            editor.events.enableBlur();
          }
        }
      }); // Show image popup when it was selected.

      editor.events.on('keyup', function (e) {
        if (e.shiftKey && editor.selection.text().replace(/\n/g, '') === '' && editor.keys.isArrow(e.which)) {
          var s_el = editor.selection.element();
          var e_el = editor.selection.endElement();

          if (s_el && s_el.tagName == 'IMG') {
            _editImg($(s_el));
          } else if (e_el && e_el.tagName == 'IMG') {
            _editImg($(e_el));
          }
        }
      }, true); // Drop inside the editor.

      editor.events.on('drop', _drop);
      editor.events.on('element.beforeDrop', _beforeElementDrop);
      editor.events.on('mousedown window.mousedown', _markExit);
      editor.events.on('window.touchmove', _unmarkExit);
      editor.events.on('mouseup window.mouseup', function () {
        if ($current_image) {
          _exitEdit();

          return false;
        }

        _unmarkExit();
      });
      editor.events.on('commands.mousedown', function ($btn) {
        if ($btn.parents('.fr-toolbar').length > 0) {
          _exitEdit();
        }
      });
      editor.events.on('image.resizeEnd', function () {
        if (editor.opts.iframe) {
          editor.size.syncIframe();
        }
      });
      editor.events.on('blur image.hideResizer commands.undo commands.redo element.dropped', function () {
        mousedown = false;

        _exitEdit(true);
      });
      editor.events.on('modals.hide', function () {
        if ($current_image) {
          _selectImage();

          editor.selection.clear();
        }
      });
      editor.events.on('image.resizeEnd', function () {
        if (editor.win.getSelection) {
          _editImg($current_image);
        }
      }); // Add new line after image is inserted.

      if (editor.opts.imageAddNewLine) {
        editor.events.on('image.inserted', function ($img) {
          var lastNode = $img.get(0); // Ignore first BR after image.

          if (lastNode.nextSibling && lastNode.nextSibling.tagName === 'BR') lastNode = lastNode.nextSibling; // Look upper nodes.

          while (lastNode && !editor.node.isElement(lastNode)) {
            if (!editor.node.isLastSibling(lastNode)) {
              lastNode = null;
            } else {
              lastNode = lastNode.parentNode;
            }
          } // If node is element, then image is last element.


          if (editor.node.isElement(lastNode)) {
            // ENTER_BR mode.
            if (editor.opts.enter === FE.ENTER_BR) {
              $img.after('<br>');
            } else {
              var $parent = $(editor.node.blockParent($img.get(0)));
              $parent.after('<' + editor.html.defaultTag() + '><br></' + editor.html.defaultTag() + '>');
            }
          }
        });
      }
    }
    /**
     * Init the image upload popup.
     */


    function _initInsertPopup(delayed) {
      if (delayed) {
        editor.popups.onRefresh('image.insert', _refreshInsertPopup);
        editor.popups.onHide('image.insert', _hideInsertPopup);
        return true;
      }

      var active;
      var $popup; // Image buttons.

      var image_buttons = ''; // https://github.com/froala/wysiwyg-editor/issues/2987

      if (!editor.opts.imageUpload && editor.opts.imageInsertButtons.indexOf('imageUpload') !== -1) {
        editor.opts.imageInsertButtons.splice(editor.opts.imageInsertButtons.indexOf('imageUpload'), 1);
      }

      var buttonList = editor.button.buildList(editor.opts.imageInsertButtons);

      if (buttonList !== '') {
        image_buttons = '<div class="fr-buttons fr-tabs">' + buttonList + '</div>';
      }

      var uploadIndex = editor.opts.imageInsertButtons.indexOf('imageUpload');
      var urlIndex = editor.opts.imageInsertButtons.indexOf('imageByURL'); // Image upload layer.

      var upload_layer = '';

      if (uploadIndex >= 0) {
        active = ' fr-active';

        if (urlIndex >= 0 && uploadIndex > urlIndex) {
          active = '';
        }

        upload_layer = '<div class="fr-image-upload-layer' + active + ' fr-layer" id="fr-image-upload-layer-' + editor.id + '"><strong>' + editor.language.translate('Drop image') + '</strong><br>(' + editor.language.translate('or click') + ')<div class="fr-form"><input type="file" accept="image/' + editor.opts.imageAllowedTypes.join(', image/').toLowerCase() + '" tabIndex="-1" aria-labelledby="fr-image-upload-layer-' + editor.id + '" role="button"></div></div>';
      } // Image by url layer.


      var by_url_layer = '';

      if (urlIndex >= 0) {
        active = ' fr-active';

        if (uploadIndex >= 0 && urlIndex > uploadIndex) {
          active = '';
        }

        by_url_layer = '<div class="fr-image-by-url-layer' + active + ' fr-layer" id="fr-image-by-url-layer-' + editor.id + '"><div class="fr-input-line"><input id="fr-image-by-url-layer-text-' + editor.id + '" type="text" placeholder="http://" tabIndex="1" aria-required="true"></div><div class="fr-action-buttons"><button type="button" class="fr-command fr-submit" data-cmd="imageInsertByURL" tabIndex="2" role="button">' + editor.language.translate('Insert') + '</button></div></div>';
      } // Progress bar.


      var progress_bar_layer = '<div class="fr-image-progress-bar-layer fr-layer"><h3 tabIndex="-1" class="fr-message">Uploading</h3><div class="fr-loader"><span class="fr-progress"></span></div><div class="fr-action-buttons"><button type="button" class="fr-command fr-dismiss" data-cmd="imageDismissError" tabIndex="2" role="button">OK</button></div></div>';
      var template = {
        buttons: image_buttons,
        upload_layer: upload_layer,
        by_url_layer: by_url_layer,
        progress_bar: progress_bar_layer // Set the template in the popup.

      };

      if (editor.opts.imageInsertButtons.length >= 1) {
        $popup = editor.popups.create('image.insert', template);
      }

      if (editor.$wp) {
        editor.events.$on(editor.$wp, 'scroll', function () {
          if ($current_image && editor.popups.isVisible('image.insert')) {
            replace();
          }
        });
      }

      _bindInsertEvents($popup);

      return $popup;
    }
    /**
     * Refresh the ALT popup.
     */


    function _refreshAltPopup() {
      if ($current_image) {
        var $popup = editor.popups.get('image.alt');
        $popup.find('input').val($current_image.attr('alt') || '').trigger('change');
      }
    }
    /**
     * Show the ALT popup.
     */


    function showAltPopup() {
      var $popup = editor.popups.get('image.alt');
      if (!$popup) $popup = _initAltPopup();
      hideProgressBar();
      editor.popups.refresh('image.alt');
      editor.popups.setContainer('image.alt', editor.$sc);
      var $el = getEl();

      if (hasCaption()) {
        $el = $el.find('.fr-img-wrap');
      }

      var left = $el.offset().left + $el.outerWidth() / 2;
      var top = $el.offset().top + $el.outerHeight();
      editor.popups.show('image.alt', left, top, $el.outerHeight(), true);
    }
    /**
     * Init the image upload popup.
     */


    function _initAltPopup(delayed) {
      if (delayed) {
        editor.popups.onRefresh('image.alt', _refreshAltPopup);
        return true;
      } // Image buttons.


      var image_buttons = '';
      image_buttons = '<div class="fr-buttons fr-tabs">' + editor.button.buildList(editor.opts.imageAltButtons) + '</div>'; // Image by url layer.

      var alt_layer = '';
      alt_layer = '<div class="fr-image-alt-layer fr-layer fr-active" id="fr-image-alt-layer-' + editor.id + '"><div class="fr-input-line"><input id="fr-image-alt-layer-text-' + editor.id + '" type="text" placeholder="' + editor.language.translate('Alternative Text') + '" tabIndex="1"></div><div class="fr-action-buttons"><button type="button" class="fr-command fr-submit" data-cmd="imageSetAlt" tabIndex="2" role="button">' + editor.language.translate('Update') + '</button></div></div>';
      var template = {
        buttons: image_buttons,
        alt_layer: alt_layer // Set the template in the popup.

      };
      var $popup = editor.popups.create('image.alt', template);

      if (editor.$wp) {
        editor.events.$on(editor.$wp, 'scroll.image-alt', function () {
          if ($current_image && editor.popups.isVisible('image.alt')) {
            showAltPopup();
          }
        });
      }

      return $popup;
    }
    /**
     * Set ALT based on the values from the popup.
     */


    function setAlt(alt) {
      if ($current_image) {
        var $popup = editor.popups.get('image.alt');
        $current_image.attr('alt', alt || $popup.find('input').val() || '');
        $popup.find('input:focus').blur();

        _editImg($current_image);
      }
    }
    /**
     * Refresh the size popup.
     */
    // Issue 2845


    function _refreshSizePopup() {
      var $popup = editor.popups.get('image.size');

      if ($current_image) {
        if (hasCaption()) {
          var $el = $current_image.parent();

          if (!$el.get(0).style.width) {
            $el = $current_image.parent().parent();
          }

          $popup.find('input[name="width"]').val($el.get(0).style.width).trigger('change');
          $popup.find('input[name="height"]').val($el.get(0).style.height).trigger('change');
        } else {
          $popup.find('input[name="width"]').val($current_image.get(0).style.width).trigger('change');
          $popup.find('input[name="height"]').val($current_image.get(0).style.height).trigger('change');
        }
      }
    }
    /**
     * Show the size popup.
     */


    function showSizePopup() {
      var $popup = editor.popups.get('image.size');
      if (!$popup) $popup = _initSizePopup();
      hideProgressBar();
      editor.popups.refresh('image.size');
      editor.popups.setContainer('image.size', editor.$sc);
      var $el = getEl();

      if (hasCaption()) {
        $el = $el.find('.fr-img-wrap');
      }

      var left = $el.offset().left + $el.outerWidth() / 2;
      var top = $el.offset().top + $el.outerHeight();
      editor.popups.show('image.size', left, top, $el.outerHeight(), true);
    }
    /**
     * Init the image upload popup.
     */


    function _initSizePopup(delayed) {
      if (delayed) {
        editor.popups.onRefresh('image.size', _refreshSizePopup);
        return true;
      } // Image buttons.


      var image_buttons = '';
      image_buttons = '<div class="fr-buttons fr-tabs">' + editor.button.buildList(editor.opts.imageSizeButtons) + '</div>'; // Size layer.

      var size_layer = '';
      size_layer = '<div class="fr-image-size-layer fr-layer fr-active" id="fr-image-size-layer-' + editor.id + '"><div class="fr-image-group"><div class="fr-input-line"><input id="fr-image-size-layer-width-' + editor.id + '" type="text" name="width" placeholder="' + editor.language.translate('Width') + '" tabIndex="1"></div><div class="fr-input-line"><input id="fr-image-size-layer-height' + editor.id + '" type="text" name="height" placeholder="' + editor.language.translate('Height') + '" tabIndex="1"></div></div><div class="fr-action-buttons"><button type="button" class="fr-command fr-submit" data-cmd="imageSetSize" tabIndex="2" role="button">' + editor.language.translate('Update') + '</button></div></div>';
      var template = {
        buttons: image_buttons,
        size_layer: size_layer // Set the template in the popup.

      };
      var $popup = editor.popups.create('image.size', template);

      if (editor.$wp) {
        editor.events.$on(editor.$wp, 'scroll.image-size', function () {
          if ($current_image && editor.popups.isVisible('image.size')) {
            showSizePopup();
          }
        });
      }

      return $popup;
    }
    /**
     * Set size based on the current image size.
     */


    function setSize(width, height) {
      if ($current_image) {
        var $popup = editor.popups.get('image.size');
        width = width || $popup.find('input[name="width"]').val() || '';
        height = height || $popup.find('input[name="height"]').val() || '';
        var regex = /^[\d]+((px)|%)*$/g;
        $current_image.removeAttr('width').removeAttr('height');
        if (width.match(regex)) $current_image.css('width', width);else $current_image.css('width', '');
        if (height.match(regex)) $current_image.css('height', height);else $current_image.css('height', '');

        if (hasCaption()) {
          $current_image.parents('.fr-img-caption').removeAttr('width').removeAttr('height');
          if (width.match(regex)) $current_image.parents('.fr-img-caption').css('width', width);else $current_image.parents('.fr-img-caption').css('width', '');
          if (height.match(regex)) $current_image.parents('.fr-img-caption').css('height', height);else $current_image.parents('.fr-img-caption').css('height', '');
        }

        if ($popup) $popup.find('input:focus').blur();

        _editImg($current_image);
      }
    }
    /**
     * Show the image upload layer.
     */


    function showLayer(name) {
      var $popup = editor.popups.get('image.insert');
      var left;
      var top; // Click on the button from the toolbar without image selected.

      if (!$current_image && !editor.opts.toolbarInline) {
        var $btn = editor.$tb.find('.fr-command[data-cmd="insertImage"]');
        left = $btn.offset().left;
        top = $btn.offset().top + (editor.opts.toolbarBottom ? 10 : $btn.outerHeight() - 10);
      } // Image is selected.
      else if ($current_image) {
          var $el = getEl();

          if (hasCaption()) {
            $el = $el.find('.fr-img-wrap');
          } // Set the top to the bottom of the image.


          top = $el.offset().top + $el.outerHeight();
          left = $el.offset().left;
        } // Image is selected and we are in inline mode.


      if (!$current_image && editor.opts.toolbarInline) {
        // Set top to the popup top.
        top = $popup.offset().top - editor.helpers.getPX($popup.css('margin-top')); // If the popup is above apply height correction.

        if ($popup.hasClass('fr-above')) {
          top += $popup.outerHeight();
        }
      } // Show the new layer.


      $popup.find('.fr-layer').removeClass('fr-active');
      $popup.find('.fr-' + name + '-layer').addClass('fr-active');
      editor.popups.show('image.insert', left, top, $current_image ? $current_image.outerHeight() : 0);
      editor.accessibility.focusPopup($popup);
    }
    /**
     * Refresh the upload image button.
     */


    function refreshUploadButton($btn) {
      var $popup = editor.popups.get('image.insert');

      if ($popup && $popup.find('.fr-image-upload-layer').hasClass('fr-active')) {
        $btn.addClass('fr-active').attr('aria-pressed', true);
      }
    }
    /**
     * Refresh the insert by url button.
     */


    function refreshByURLButton($btn) {
      var $popup = editor.popups.get('image.insert');

      if ($popup && $popup.find('.fr-image-by-url-layer').hasClass('fr-active')) {
        $btn.addClass('fr-active').attr('aria-pressed', true);
      }
    }

    function _resizeImage(e, initPageX, direction, step) {
      e.pageX = initPageX;

      _handlerMousedown.call(this, e);

      e.pageX = e.pageX + direction * Math.floor(Math.pow(1.1, step));

      _handlerMousemove.call(this, e);

      _handlerMouseup.call(this, e);

      return ++step;
    }
    /**
     * Init image resizer.
     */


    function _initImageResizer() {
      var doc; // No shared image resizer.

      if (!editor.shared.$image_resizer) {
        // Create shared image resizer.
        editor.shared.$image_resizer = $(document.createElement('div')).attr('class', 'fr-image-resizer');
        $image_resizer = editor.shared.$image_resizer; // Bind mousedown event shared.

        editor.events.$on($image_resizer, 'mousedown', function (e) {
          e.stopPropagation();
        }, true); // Image resize is enabled.

        if (editor.opts.imageResize) {
          $image_resizer.append(_getHandler('nw') + _getHandler('ne') + _getHandler('sw') + _getHandler('se')); // Add image resizer overlay and set it.

          editor.shared.$img_overlay = $(document.createElement('div')).attr('class', 'fr-image-overlay');
          $overlay = editor.shared.$img_overlay;
          doc = $image_resizer.get(0).ownerDocument;
          $(doc).find('body').first().append($overlay);
        }
      } else {
        $image_resizer = editor.shared.$image_resizer;
        $overlay = editor.shared.$img_overlay;
        editor.events.on('destroy', function () {
          $('body').first().append($image_resizer.removeClass('fr-active'));
        }, true);
      } // Shared destroy.


      editor.events.on('shared.destroy', function () {
        $image_resizer.html('').removeData().remove();
        $image_resizer = null;

        if (editor.opts.imageResize) {
          $overlay.remove();
          $overlay = null;
        }
      }, true); // Window resize. Exit from edit.

      if (!editor.helpers.isMobile()) {
        editor.events.$on($(editor.o_win), 'resize', function () {
          if ($current_image && !$current_image.hasClass('fr-uploading')) {
            _exitEdit(true);
          } else if ($current_image) {
            _repositionResizer();

            replace();
            showProgressBar(false);
          }
        });
      } // Image resize is enabled.


      if (editor.opts.imageResize) {
        doc = $image_resizer.get(0).ownerDocument;
        editor.events.$on($image_resizer, editor._mousedown, '.fr-handler', _handlerMousedown);
        editor.events.$on($(doc), editor._mousemove, _handlerMousemove);
        editor.events.$on($(doc.defaultView || doc.parentWindow), editor._mouseup, _handlerMouseup);
        editor.events.$on($overlay, 'mouseleave', _handlerMouseup); // Accessibility.
        // Used for keys holing.

        var step = 1;
        var prevKey = null;
        var prevTimestamp = 0; // Keydown event.

        editor.events.on('keydown', function (e) {
          if ($current_image) {
            var ctrlKey = navigator.userAgent.indexOf('Mac OS X') != -1 ? e.metaKey : e.ctrlKey;
            var keycode = e.which;

            if (keycode !== prevKey || e.timeStamp - prevTimestamp > 200) {
              step = 1; // Reset step. Known browser issue: Keyup does not trigger when ctrl is pressed.
            } // Increase image size.


            if ((keycode == FE.KEYCODE.EQUALS || editor.browser.mozilla && keycode == FE.KEYCODE.FF_EQUALS) && ctrlKey && !e.altKey) {
              step = _resizeImage.call(this, e, 1, 1, step);
            } // Decrease image size.
            else if ((keycode == FE.KEYCODE.HYPHEN || editor.browser.mozilla && keycode == FE.KEYCODE.FF_HYPHEN) && ctrlKey && !e.altKey) {
                step = _resizeImage.call(this, e, 2, -1, step);
              } else if (!editor.keys.ctrlKey(e) && keycode == FE.KEYCODE.ENTER) {
                $current_image.before('<br>');

                _editImg($current_image);
              } // Save key code.


            prevKey = keycode; // Save timestamp.

            prevTimestamp = e.timeStamp;
          }
        }, true); // Reset the step on key up event.

        editor.events.on('keyup', function () {
          step = 1;
        });
      }
    }
    /**
     * Remove the current image.
     */


    function remove($img) {
      $img = $img || getEl();

      if ($img) {
        if (editor.events.trigger('image.beforeRemove', [$img]) !== false) {
          editor.popups.hideAll();

          _selectImage();

          _exitEdit(true);

          if (!editor.undo.canDo()) editor.undo.saveStep();

          if ($img.get(0) == editor.el) {
            $img.removeAttr('src');
          } else {
            if ($img.get(0).parentNode && $img.get(0).parentNode.tagName == 'A') {
              editor.selection.setBefore($img.get(0).parentNode) || editor.selection.setAfter($img.get(0).parentNode) || $img.parent().after(FE.MARKERS);
              $($img.get(0).parentNode).remove();
            } else {
              editor.selection.setBefore($img.get(0)) || editor.selection.setAfter($img.get(0)) || $img.after(FE.MARKERS);
              $img.remove();
            }

            editor.html.fillEmptyBlocks();
            editor.selection.restore();
          }

          editor.undo.saveStep();
        }
      }
    }

    function _editorKeydownHandler(e) {
      var key_code = e.which;

      if ($current_image && (key_code == FE.KEYCODE.BACKSPACE || key_code == FE.KEYCODE.DELETE)) {
        e.preventDefault();
        e.stopPropagation();
        remove();
        return false;
      } else if ($current_image && key_code == FE.KEYCODE.ESC) {
        var $img = $current_image;

        _exitEdit(true);

        editor.selection.setAfter($img.get(0));
        editor.selection.restore();
        e.preventDefault();
        return false;
      } // Move cursor if left and right arrows are used.
      else if ($current_image && (key_code == FE.KEYCODE.ARROW_LEFT || key_code == FE.KEYCODE.ARROW_RIGHT)) {
          var img = $current_image.get(0);

          _exitEdit(true);

          if (key_code == FE.KEYCODE.ARROW_LEFT) {
            editor.selection.setBefore(img);
          } else {
            editor.selection.setAfter(img);
          }

          editor.selection.restore();
          e.preventDefault();
          return false;
        } else if ($current_image && key_code === FE.KEYCODE.TAB) {
          e.preventDefault();
          e.stopPropagation();

          _exitEdit(true);

          return false;
        } else if ($current_image && key_code != FE.KEYCODE.F10 && !editor.keys.isBrowserAction(e)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
    }
    /**
     * Do some cleanup on images.
     */


    function _cleanOnGet(el) {
      // Tag is image.
      if (el && el.tagName == 'IMG') {
        // Remove element if it has class fr-uploading or fr-error.
        if (editor.node.hasClass(el, 'fr-uploading') || editor.node.hasClass(el, 'fr-error')) {
          el.parentNode.removeChild(el);
        } // Remove class if it is draggable.
        else if (editor.node.hasClass(el, 'fr-draggable')) {
            el.classList.remove('fr-draggable');
          }

        if (el.parentNode && el.parentNode.parentNode && editor.node.hasClass(el.parentNode.parentNode, 'fr-img-caption')) {
          var p_node = el.parentNode.parentNode;
          p_node.removeAttribute('contenteditable');
          p_node.removeAttribute('draggable');
          p_node.classList.remove('fr-draggable');
          var n_node = el.nextSibling;

          if (n_node) {
            n_node.removeAttribute('contenteditable');
          }
        }
      } // Look for inner nodes that might be in a similar case.
      else if (el && el.nodeType == Node.ELEMENT_NODE) {
          var imgs = el.querySelectorAll('img.fr-uploading, img.fr-error, img.fr-draggable');

          for (var i = 0; i < imgs.length; i++) {
            _cleanOnGet(imgs[i]);
          }
        }
    }
    /**
     * Initialization.
     */


    function _init() {
      _initEvents(); // Init on image.


      if (editor.el.tagName == 'IMG') {
        editor.$el.addClass('fr-view');
      }

      editor.events.$on(editor.$el, editor.helpers.isMobile() && !editor.helpers.isWindowsPhone() ? 'touchend' : 'click', editor.el.tagName == 'IMG' ? null : 'img:not([contenteditable="false"])', _edit);

      if (editor.helpers.isMobile()) {
        editor.events.$on(editor.$el, 'touchstart', editor.el.tagName == 'IMG' ? null : 'img:not([contenteditable="false"])', function () {
          touchScroll = false;
        });
        editor.events.$on(editor.$el, 'touchmove', function () {
          touchScroll = true;
        });
      }

      if (editor.$wp) {
        editor.events.on('window.keydown keydown', _editorKeydownHandler, true);
        editor.events.on('keyup', function (e) {
          if ($current_image && e.which == FE.KEYCODE.ENTER) {
            return false;
          }
        }, true); // Prevent typing in image caption DOM structure.

        editor.events.$on(editor.$el, 'keydown', function () {
          var el = editor.selection.element(); // Parent node of the current element.

          if (el.nodeType === Node.TEXT_NODE || el.tagName == 'BR' && editor.node.isLastSibling(el)) {
            el = el.parentNode;
          }

          if (!editor.node.hasClass(el, 'fr-inner')) {
            if (!editor.node.hasClass(el, 'fr-img-caption')) {
              el = $(el).parents('.fr-img-caption').get(0);
            } // Check if we are in image caption.


            if (editor.node.hasClass(el, 'fr-img-caption')) {
              $(el).after(FE.INVISIBLE_SPACE + FE.MARKERS);
              editor.selection.restore();
            }
          }
        });
      } else {
        editor.events.$on(editor.$win, 'keydown', _editorKeydownHandler);
      } // ESC from accessibility.


      editor.events.on('toolbar.esc', function () {
        if ($current_image) {
          if (editor.$wp) {
            editor.events.disableBlur();
            editor.events.focus();
          } else {
            var $img = $current_image;

            _exitEdit(true);

            editor.selection.setAfter($img.get(0));
            editor.selection.restore();
          }

          return false;
        }
      }, true); // focusEditor from accessibility.

      editor.events.on('toolbar.focusEditor', function () {
        if ($current_image) {
          return false;
        }
      }, true); // Copy/cut image.

      editor.events.on('window.cut window.copy', function (e) {
        // Do copy only if image.edit popups is visible and not focused.
        if ($current_image && editor.popups.isVisible('image.edit') && !editor.popups.get('image.edit').find(':focus').length) {
          var $el = getEl();

          if (hasCaption()) {
            $el.before(FE.START_MARKER);
            $el.after(FE.END_MARKER);
            editor.selection.restore();
            editor.paste.saveCopiedText($el.get(0).outerHTML, $el.text());
          } else {
            _selectImage();

            editor.paste.saveCopiedText($current_image.get(0).outerHTML, $current_image.attr('alt'));
          }

          if (e.type == 'copy') {
            setTimeout(function () {
              _editImg($current_image);
            });
          } else {
            _exitEdit(true);

            editor.undo.saveStep();
            setTimeout(function () {
              editor.undo.saveStep();
            }, 0);
          }
        }
      }, true); // Fix IE copy not working when selection is collapsed.

      if (editor.browser.msie) {
        editor.events.on('keydown', function (e) {
          // Selection is collapsed and we have an image.
          if (!(editor.selection.isCollapsed() && $current_image)) return true;
          var key_code = e.which; // Copy.

          if (key_code == FE.KEYCODE.C && editor.keys.ctrlKey(e)) {
            editor.events.trigger('window.copy');
          } // Cut.
          else if (key_code == FE.KEYCODE.X && editor.keys.ctrlKey(e)) {
              editor.events.trigger('window.cut');
            }
        });
      } // Do not leave page while uploading.


      editor.events.$on($(editor.o_win), 'keydown', function (e) {
        var key_code = e.which;

        if ($current_image && key_code == FE.KEYCODE.BACKSPACE) {
          e.preventDefault();
          return false;
        }
      }); // Check if image is uploading to abort it.

      editor.events.$on(editor.$win, 'keydown', function (e) {
        var key_code = e.which;

        if ($current_image && $current_image.hasClass('fr-uploading') && key_code == FE.KEYCODE.ESC) {
          $current_image.trigger('abortUpload');
        }
      });
      editor.events.on('destroy', function () {
        if ($current_image && $current_image.hasClass('fr-uploading')) {
          $current_image.trigger('abortUpload');
        }
      });
      editor.events.on('paste.before', _clipboardPaste);
      editor.events.on('paste.beforeCleanup', _clipboardPasteCleanup);
      editor.events.on('paste.after', _uploadPastedImages);
      editor.events.on('html.set', _refreshImageList);
      editor.events.on('html.inserted', _refreshImageList);

      _refreshImageList();

      editor.events.on('destroy', function () {
        images = [];
      }); // Remove any fr-uploading / fr-error images.

      editor.events.on('html.processGet', _cleanOnGet);

      if (editor.opts.imageOutputSize) {
        var imgs;
        editor.events.on('html.beforeGet', function () {
          imgs = editor.el.querySelectorAll('img');

          for (var i = 0; i < imgs.length; i++) {
            var width = imgs[i].style.width || $(imgs[i]).width();
            var height = imgs[i].style.height || $(imgs[i]).height();
            if (width) imgs[i].setAttribute('width', ('' + width).replace(/px/, ''));
            if (height) imgs[i].setAttribute('height', ('' + height).replace(/px/, ''));
          }
        });
      }

      if (editor.opts.iframe) {
        editor.events.on('image.loaded', editor.size.syncIframe);
      }

      if (editor.$wp) {
        _syncImages();

        editor.events.on('contentChanged', _syncImages);
      }

      editor.events.$on($(editor.o_win), 'orientationchange.image', function () {
        setTimeout(function () {
          if ($current_image) {
            _editImg($current_image);
          }
        }, 100);
      });

      _initEditPopup(true);

      _initInsertPopup(true);

      _initSizePopup(true);

      _initAltPopup(true);

      editor.events.on('node.remove', function ($node) {
        if ($node.get(0).tagName == 'IMG') {
          remove($node);
          return false;
        }
      });
    }

    function _processPastedImage(img) {
      if (editor.events.trigger('image.beforePasteUpload', [img]) === false) {
        return false;
      } // Show the progress bar.


      $current_image = $(img);

      _repositionResizer();

      _showEditPopup();

      replace();
      showProgressBar();
      $current_image.on('load', function () {
        _repositionResizer(); // https://github.com/froala/wysiwyg-editor/issues/3407


        if ($(editor.popups.get('image.insert').get(0)).find('div.fr-active.fr-error').length < 1) {
          showProgressBar();
        }

        $(this).off('load');
      });
      var splitSrc = $(img).attr('src').split(','); // Convert image to blob.

      var binary = atob(splitSrc[1]);
      var array = [];

      for (var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
      }

      var upload_img = new Blob([new Uint8Array(array)], {
        type: splitSrc[0].replace(/data\:/g, '').replace(/;base64/g, '')
      });
      upload([upload_img], $current_image);
    }

    function _uploadPastedImages() {
      if (!editor.opts.imagePaste) {
        editor.$el.find('img[data-fr-image-pasted]').remove();
      } else {
        // Safari won't work https://bugs.webkit.org/show_bug.cgi?id=49141
        editor.$el.find('img[data-fr-image-pasted]').each(function (index, img) {
          if (editor.opts.imagePasteProcess) {
            var width = editor.opts.imageDefaultWidth;

            if (width && width != 'auto') {
              width = width + (editor.opts.imageResizeWithPercent ? '%' : 'px');
            }

            $(img).css('width', width).removeClass('fr-dii fr-dib fr-fir fr-fil');

            _setStyle($(img), editor.opts.imageDefaultDisplay, editor.opts.imageDefaultAlign);
          } // Data images.


          if (img.src.indexOf('data:') === 0) {
            _processPastedImage(img);
          } // New way Safari is pasting images.
          else if (img.src.indexOf('blob:') === 0 || img.src.indexOf('http') === 0 && editor.opts.imageUploadRemoteUrls && editor.opts.imageCORSProxy) {
              var _img = new Image();

              _img.crossOrigin = 'Anonymous';

              _img.onload = function () {
                // Create canvas.
                var canvas = editor.o_doc.createElement('CANVAS');
                var context = canvas.getContext('2d'); // Set height.

                canvas.height = this.naturalHeight;
                canvas.width = this.naturalWidth; // Draw image.

                context.drawImage(this, 0, 0); // pushing the execution at end of the stack

                setTimeout(function () {
                  _processPastedImage(img);
                }, 0);
                var imgExt;

                if (this.naturalWidth > 2000 || this.naturalHeight > 1500) {
                  imgExt = 'jpeg'; // if images are too large
                } else {
                  imgExt = 'png';
                } // Update image and process it.


                img.src = canvas.toDataURL('image/' + imgExt);
              };

              _img.src = (img.src.indexOf('blob:') === 0 ? '' : editor.opts.imageCORSProxy + '/') + img.src;
            } // Images without http (Safari ones.).
            else if (img.src.indexOf('http') !== 0 || img.src.indexOf('https://mail.google.com/mail') === 0) {
                editor.selection.save();
                $(img).remove();
                editor.selection.restore();
              } else {
                $(img).removeAttr('data-fr-image-pasted');
              }
        });
      }
    }

    function _clipboardImageLoaded(e) {
      var result = e.target.result; // Default width.

      var width = editor.opts.imageDefaultWidth;

      if (width && width != 'auto') {
        width = width + (editor.opts.imageResizeWithPercent ? '%' : 'px');
      }

      editor.undo.saveStep();
      editor.html.insert('<img data-fr-image-pasted="true" src="' + result + '"' + (width ? ' style="width: ' + width + ';"' : '') + '>');
      var $img = editor.$el.find('img[data-fr-image-pasted="true"]');

      if ($img) {
        _setStyle($img, editor.opts.imageDefaultDisplay, editor.opts.imageDefaultAlign);
      }

      editor.events.trigger('paste.after');
    }

    function _processsClipboardPaste(file) {
      var reader = new FileReader();
      reader.onload = _clipboardImageLoaded;
      reader.readAsDataURL(file);
    }

    function _clipboardPaste(e) {
      if (e && e.clipboardData && e.clipboardData.items) {
        var file = null;

        if (!(e.clipboardData.types && [].indexOf.call(e.clipboardData.types, 'text/rtf') != -1 || e.clipboardData.getData('text/rtf'))) {
          for (var i = 0; i < e.clipboardData.items.length; i++) {
            file = e.clipboardData.items[i].getAsFile();

            if (file) {
              break;
            }
          }
        } else {
          file = e.clipboardData.items[0].getAsFile();
        }

        if (file) {
          _processsClipboardPaste(file);

          return false;
        }
      }
    }

    function _clipboardPasteCleanup(clipboard_html) {
      clipboard_html = clipboard_html.replace(/<img /gi, '<img data-fr-image-pasted="true" ');
      return clipboard_html;
    }
    /**
     * Start edit.
     */


    var touchScroll;

    function _edit(e) {
      if ($(this).parents('[contenteditable]').not('.fr-element').not('.fr-img-caption').not('body').first().attr('contenteditable') == 'false') return true;

      if (e && e.type == 'touchend' && touchScroll) {
        return true;
      }

      if (e && editor.edit.isDisabled()) {
        e.stopPropagation();
        e.preventDefault();
        return false;
      } // Hide resizer for other instances.


      for (var i = 0; i < FE.INSTANCES.length; i++) {
        if (FE.INSTANCES[i] != editor) {
          FE.INSTANCES[i].events.trigger('image.hideResizer');
        }
      }

      editor.toolbar.disable();

      if (e) {
        e.stopPropagation();
        e.preventDefault();
      } // Hide keyboard.


      if (editor.helpers.isMobile()) {
        editor.events.disableBlur();
        editor.$el.blur();
        editor.events.enableBlur();
      }

      if (editor.opts.iframe) {
        editor.size.syncIframe();
      } // Store current image.


      $current_image = $(this); // Select image.

      _selectImage(); // Reposition resizer.


      _repositionResizer();

      _showEditPopup(); // Issue 2801


      if (editor.browser.msie) {
        if (editor.popups.areVisible()) {
          editor.events.disableBlur();
        }

        if (editor.win.getSelection) {
          editor.win.getSelection().removeAllRanges();
          editor.win.getSelection().addRange(editor.doc.createRange());
        }
      } else {
        editor.selection.clear();
      } // Fix for image remaining selected.


      if (editor.helpers.isIOS()) {
        editor.events.disableBlur();
        editor.$el.blur();
      } // Refresh buttons.


      editor.button.bulkRefresh();
      editor.events.trigger('video.hideResizer');
    }
    /**
     * Exit edit.
     */


    function _exitEdit(force_exit) {
      if ($current_image && (_canExit() || force_exit === true)) {
        editor.toolbar.enable();
        $image_resizer.removeClass('fr-active');
        editor.popups.hide('image.edit');
        $current_image = null;

        _unmarkExit();

        $handler = null;

        if ($overlay) {
          $overlay.hide();
        }
      }
    }

    var img_exit_flag = false;

    function _markExit() {
      img_exit_flag = true;
    }

    function _unmarkExit() {
      img_exit_flag = false;
    }

    function _canExit() {
      return img_exit_flag;
    }
    /**
     * Set style for image.
     */


    function _setStyle($img, _display, _align) {
      if (!editor.opts.htmlUntouched && editor.opts.useClasses) {
        $img.removeClass('fr-fil fr-fir fr-dib fr-dii');

        if (_align) {
          $img.addClass('fr-fi' + _align[0]);
        }

        if (_display) {
          $img.addClass('fr-di' + _display[0]);
        }
      } else {
        if (_display == 'inline') {
          $img.css({
            display: 'inline-block',
            verticalAlign: 'bottom',
            margin: editor.opts.imageDefaultMargin
          });

          if (_align == 'center') {
            $img.css({
              'float': 'none',
              marginBottom: '',
              marginTop: '',
              maxWidth: 'calc(100% - ' + 2 * editor.opts.imageDefaultMargin + 'px)',
              textAlign: 'center'
            });
          } else if (_align == 'left') {
            $img.css({
              'float': 'left',
              marginLeft: 0,
              maxWidth: 'calc(100% - ' + editor.opts.imageDefaultMargin + 'px)',
              textAlign: 'left'
            });
          } else {
            $img.css({
              'float': 'right',
              marginRight: 0,
              maxWidth: 'calc(100% - ' + editor.opts.imageDefaultMargin + 'px)',
              textAlign: 'right'
            });
          }
        } else if (_display == 'block') {
          $img.css({
            display: 'block',
            'float': 'none',
            verticalAlign: 'top',
            margin: editor.opts.imageDefaultMargin + 'px auto',
            textAlign: 'center'
          });

          if (_align == 'left') {
            $img.css({
              marginLeft: 0,
              textAlign: 'left'
            });
          } else if (_align == 'right') {
            $img.css({
              marginRight: 0,
              textAlign: 'right'
            });
          }
        }
      }
    }
    /**
     * Align image.
     */


    function align(val) {
      var $el = getEl();
      $el.removeClass('fr-fir fr-fil'); // Easy case. Use classes.

      if (!editor.opts.htmlUntouched && editor.opts.useClasses) {
        if (val == 'left') {
          $el.addClass('fr-fil');
        } else if (val == 'right') {
          $el.addClass('fr-fir');
        }
      } else {
        _setStyle($el, getDisplay(), val);
      }

      _selectImage();

      _repositionResizer();

      _showEditPopup();

      editor.selection.clear();
    }
    /**
     * Get image alignment.
     */


    function getAlign($img) {
      if (typeof $img == 'undefined') $img = getEl();

      if ($img) {
        // Image has left class.
        if ($img.hasClass('fr-fil')) {
          return 'left';
        } // Image has right class.
        else if ($img.hasClass('fr-fir')) {
            return 'right';
          } // Image has display class set.
          else if ($img.hasClass('fr-dib') || $img.hasClass('fr-dii')) {
              return 'center';
            } else {
              // Set float to none.
              var flt = $img.css('float');
              $img.css('float', 'none'); // Image has display block.

              if ($img.css('display') == 'block') {
                // Set float to the initial value.
                $img.css('float', '');
                if ($img.css('float') != flt) $img.css('float', flt); // Margin left is 0.
                // Margin right is auto.

                if (parseInt($img.css('margin-left'), 10) === 0) {
                  return 'left';
                } // Margin left is auto.
                // Margin right is 0.
                else if (parseInt($img.css('margin-right'), 10) === 0) {
                    return 'right';
                  }
              } // Display inline.
              else {
                  // Set float.
                  $img.css('float', '');
                  if ($img.css('float') != flt) $img.css('float', flt); // Float left.

                  if ($img.css('float') == 'left') {
                    return 'left';
                  } // Float right.
                  else if ($img.css('float') == 'right') {
                      return 'right';
                    }
                }
            }
      }

      return 'center';
    }
    /**
     * Get image display.
     */


    function getDisplay($img) {
      if (typeof $img == 'undefined') $img = getEl(); // Set float to none.

      var flt = $img.css('float');
      $img.css('float', 'none'); // Image has display block.

      if ($img.css('display') == 'block') {
        // Set float to the initial value.
        $img.css('float', '');
        if ($img.css('float') != flt) $img.css('float', flt);
        return 'block';
      } // Display inline.
      else {
          // Set float.
          $img.css('float', '');
          if ($img.css('float') != flt) $img.css('float', flt);
          return 'inline';
        }

      return 'inline';
    }
    /**
     * Refresh the align icon.
     */


    function refreshAlign($btn) {
      if ($current_image) {
        $btn.find('> *').first().replaceWith(editor.icon.create('image-align-' + getAlign()));
      }
    }
    /**
     * Refresh the align option from the dropdown.
     */


    function refreshAlignOnShow($btn, $dropdown) {
      if ($current_image) {
        $dropdown.find('.fr-command[data-param1="' + getAlign() + '"]').addClass('fr-active').attr('aria-selected', true);
      }
    }
    /**
     * Align image.
     */


    function display(val) {
      var $el = getEl();
      $el.removeClass('fr-dii fr-dib'); // Easy case. Use classes.

      if (!editor.opts.htmlUntouched && editor.opts.useClasses) {
        if (val == 'inline') {
          $el.addClass('fr-dii');
        } else if (val == 'block') {
          $el.addClass('fr-dib');
        }
      } else {
        _setStyle($el, val, getAlign());
      }

      _selectImage();

      _repositionResizer();

      _showEditPopup();

      editor.selection.clear();
    }
    /**
     * Refresh the image display selected option.
     */


    function refreshDisplayOnShow($btn, $dropdown) {
      if ($current_image) {
        $dropdown.find('.fr-command[data-param1="' + getDisplay() + '"]').addClass('fr-active').attr('aria-selected', true);
      }
    }
    /**
     * Show the replace popup.
     */


    function replace() {
      var $popup = editor.popups.get('image.insert');
      if (!$popup) $popup = _initInsertPopup();

      if (!editor.popups.isVisible('image.insert')) {
        hideProgressBar();
        editor.popups.refresh('image.insert');
        editor.popups.setContainer('image.insert', editor.$sc);
      }

      var $el = getEl();

      if (hasCaption()) {
        $el = $el.find('.fr-img-wrap');
      }

      var left = $el.offset().left + $el.outerWidth() / 2;
      var top = $el.offset().top + $el.outerHeight();
      editor.popups.show('image.insert', left, top, $el.outerHeight(true), true);
    }
    /**
     * Place selection around current image.
     */


    function _selectImage() {
      if ($current_image) {
        editor.events.disableBlur();
        editor.selection.clear();
        var range = editor.doc.createRange();
        range.selectNode($current_image.get(0)); // Collapse range in IE.

        if (editor.browser.msie) range.collapse(true);
        var selection = editor.selection.get();
        selection.addRange(range);
        editor.events.enableBlur();
      }
    }
    /**
     * Get back to the image main popup.
     */


    function back() {
      if ($current_image) {
        editor.events.disableBlur();
        $('.fr-popup input:focus').blur();

        _editImg($current_image);
      } else {
        editor.events.disableBlur();
        editor.selection.restore();
        editor.events.enableBlur();
        editor.popups.hide('image.insert');
        editor.toolbar.showInline();
      }
    }
    /**
     * Get the current image.
     */


    function get() {
      return $current_image;
    }

    function getEl() {
      return hasCaption() ? $current_image.parents('.fr-img-caption').first() : $current_image;
    }
    /**
     * Apply specific style.
     */


    function applyStyle(val, imageStyles, multipleStyles) {
      if (typeof imageStyles == 'undefined') imageStyles = editor.opts.imageStyles;
      if (typeof multipleStyles == 'undefined') multipleStyles = editor.opts.imageMultipleStyles;
      if (!$current_image) return false;
      var $img = getEl(); // Remove multiple styles.

      if (!multipleStyles) {
        var styles = Object.keys(imageStyles);
        styles.splice(styles.indexOf(val), 1);
        $img.removeClass(styles.join(' '));
      }

      if (_typeof(imageStyles[val]) == 'object') {
        $img.removeAttr('style');
        $img.css(imageStyles[val].style);
      } else {
        $img.toggleClass(val);
      }

      _editImg($current_image);
    }

    function hasCaption() {
      if ($current_image) {
        return $current_image.parents('.fr-img-caption').length > 0;
      }

      return false;
    }

    function toggleCaption() {
      var $el;

      if ($current_image && !hasCaption()) {
        $el = $current_image; // Check if there is a link wrapping the image.

        if ($current_image.parent().is('a')) {
          $el = $current_image.parent();
        }

        var splitAttrs;
        var oldWidth;

        if ($el.attr('style')) {
          splitAttrs = $el.attr('style').split(':');
          oldWidth = splitAttrs.indexOf('width') > -1 ? splitAttrs[splitAttrs.indexOf('width') + 1].replace(';', '') : '';
        } // Issue 2861


        var current_width = editor.opts.imageResizeWithPercent ? (oldWidth.indexOf('px') > -1 ? null : oldWidth) || '100%' : $current_image.width() + 'px';
        $el.wrap('<span ' + (!editor.browser.mozilla ? 'contenteditable="false"' : '') + 'class="fr-img-caption ' + $current_image.attr('class') + '" style="' + (!editor.opts.useClasses ? $el.attr('style') : '') + '" draggable="false"></span>');
        $el.wrap('<span class="fr-img-wrap"></span>');
        $current_image.after('<span class="fr-inner"' + (!editor.browser.mozilla ? ' contenteditable="true"' : '') + '>' + FE.START_MARKER + editor.language.translate('Image Caption') + FE.END_MARKER + '</span>');
        $current_image.removeAttr('class').removeAttr('style').removeAttr('width');
        $current_image.parents('.fr-img-caption').css('width', current_width);

        _exitEdit(true);

        editor.selection.restore();
      } else {
        $el = getEl();
        $current_image.insertAfter($el);
        $current_image.attr('class', $el.attr('class').replace('fr-img-caption', '')).attr('style', $el.attr('style'));
        $el.remove();

        _editImg($current_image);
      }
    }

    return {
      _init: _init,
      showInsertPopup: showInsertPopup,
      showLayer: showLayer,
      refreshUploadButton: refreshUploadButton,
      refreshByURLButton: refreshByURLButton,
      upload: upload,
      insertByURL: insertByURL,
      align: align,
      refreshAlign: refreshAlign,
      refreshAlignOnShow: refreshAlignOnShow,
      display: display,
      refreshDisplayOnShow: refreshDisplayOnShow,
      replace: replace,
      back: back,
      get: get,
      getEl: getEl,
      insert: insert,
      showProgressBar: showProgressBar,
      remove: remove,
      hideProgressBar: hideProgressBar,
      applyStyle: applyStyle,
      showAltPopup: showAltPopup,
      showSizePopup: showSizePopup,
      setAlt: setAlt,
      setSize: setSize,
      toggleCaption: toggleCaption,
      hasCaption: hasCaption,
      exitEdit: _exitEdit,
      edit: _editImg
    };
  }; // Insert image button.


  FE.DefineIcon('insertImage', {
    NAME: 'image',
    SVG_KEY: 'insertImage'
  });
  FE.RegisterShortcut(FE.KEYCODE.P, 'insertImage', null, 'P');
  FE.RegisterCommand('insertImage', {
    title: 'Insert Image',
    undo: false,
    focus: true,
    refreshAfterCallback: false,
    popup: true,
    callback: function callback() {
      if (!this.popups.isVisible('image.insert')) {
        this.image.showInsertPopup();
      } else {
        if (this.$el.find('.fr-marker').length) {
          this.events.disableBlur();
          this.selection.restore();
        }

        this.popups.hide('image.insert');
      }
    },
    plugin: 'image'
  }); // Image upload button inside the insert image popup.

  FE.DefineIcon('imageUpload', {
    NAME: 'upload',
    SVG_KEY: 'upload'
  });
  FE.RegisterCommand('imageUpload', {
    title: 'Upload Image',
    undo: false,
    focus: false,
    toggle: true,
    callback: function callback() {
      this.image.showLayer('image-upload');
    },
    refresh: function refresh($btn) {
      this.image.refreshUploadButton($btn);
    }
  }); // Image by URL button inside the insert image popup.

  FE.DefineIcon('imageByURL', {
    NAME: 'link',
    SVG_KEY: 'insertLink'
  });
  FE.RegisterCommand('imageByURL', {
    title: 'By URL',
    undo: false,
    focus: false,
    toggle: true,
    callback: function callback() {
      this.image.showLayer('image-by-url');
    },
    refresh: function refresh($btn) {
      this.image.refreshByURLButton($btn);
    }
  }); // Insert image button inside the insert by URL layer.

  FE.RegisterCommand('imageInsertByURL', {
    title: 'Insert Image',
    undo: true,
    refreshAfterCallback: false,
    callback: function callback() {
      this.image.insertByURL();
    },
    refresh: function refresh($btn) {
      var $current_image = this.image.get();

      if (!$current_image) {
        $btn.text(this.language.translate('Insert'));
      } else {
        $btn.text(this.language.translate('Replace'));
      }
    }
  }); // Image display.

  FE.DefineIcon('imageDisplay', {
    NAME: 'star',
    SVG_KEY: 'imageDisplay'
  });
  FE.RegisterCommand('imageDisplay', {
    title: 'Display',
    type: 'dropdown',
    options: {
      inline: 'Inline',
      block: 'Break Text'
    },
    callback: function callback(cmd, val) {
      this.image.display(val);
    },
    refresh: function refresh($btn) {
      if (!this.opts.imageTextNear) $btn.addClass('fr-hidden');
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      this.image.refreshDisplayOnShow($btn, $dropdown);
    }
  }); // Image align.

  FE.DefineIcon('image-align', {
    NAME: 'align-left',
    SVG_KEY: 'alignLeft'
  });
  FE.DefineIcon('image-align-left', {
    NAME: 'align-left',
    SVG_KEY: 'alignLeft'
  });
  FE.DefineIcon('image-align-right', {
    NAME: 'align-right',
    SVG_KEY: 'alignRight'
  });
  FE.DefineIcon('image-align-center', {
    NAME: 'align-justify',
    SVG_KEY: 'alignCenter'
  });
  FE.DefineIcon('imageAlign', {
    NAME: 'align-justify',
    SVG_KEY: 'alignJustify'
  });
  FE.RegisterCommand('imageAlign', {
    type: 'dropdown',
    title: 'Align',
    options: {
      left: 'Align Left',
      center: 'None',
      right: 'Align Right'
    },
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = FE.COMMANDS.imageAlign.options;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          c += '<li role="presentation"><a class="fr-command fr-title" tabIndex="-1" role="option" data-cmd="imageAlign" data-param1="' + val + '" title="' + this.language.translate(options[val]) + '">' + this.icon.create('image-align-' + val) + '<span class="fr-sr-only">' + this.language.translate(options[val]) + '</span></a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      this.image.align(val);
    },
    refresh: function refresh($btn) {
      this.image.refreshAlign($btn);
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      this.image.refreshAlignOnShow($btn, $dropdown);
    }
  }); // Image replace.

  FE.DefineIcon('imageReplace', {
    NAME: 'exchange',
    FA5NAME: 'exchange-alt',
    SVG_KEY: 'replaceImage'
  });
  FE.RegisterCommand('imageReplace', {
    title: 'Replace',
    undo: false,
    focus: false,
    popup: true,
    refreshAfterCallback: false,
    callback: function callback() {
      this.image.replace();
    }
  }); // Image remove.

  FE.DefineIcon('imageRemove', {
    NAME: 'trash',
    SVG_KEY: 'remove'
  });
  FE.RegisterCommand('imageRemove', {
    title: 'Remove',
    callback: function callback() {
      this.image.remove();
    }
  }); // Image back.

  FE.DefineIcon('imageBack', {
    NAME: 'arrow-left',
    SVG_KEY: 'back'
  });
  FE.RegisterCommand('imageBack', {
    title: 'Back',
    undo: false,
    focus: false,
    back: true,
    callback: function callback() {
      this.image.back();
    },
    refresh: function refresh($btn) {
      var $ = this.$;
      var $current_image = this.image.get();

      if (!$current_image && !this.opts.toolbarInline) {
        $btn.addClass('fr-hidden');
        $btn.next('.fr-separator').addClass('fr-hidden');
      } else {
        $btn.removeClass('fr-hidden');
        $btn.next('.fr-separator').removeClass('fr-hidden');
      }
    }
  });
  FE.RegisterCommand('imageDismissError', {
    title: 'OK',
    undo: false,
    callback: function callback() {
      this.image.hideProgressBar(true);
    }
  }); // Image styles.

  FE.DefineIcon('imageStyle', {
    NAME: 'magic',
    SVG_KEY: 'imageClass'
  });
  FE.RegisterCommand('imageStyle', {
    title: 'Style',
    type: 'dropdown',
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = this.opts.imageStyles;

      for (var cls in options) {
        if (options.hasOwnProperty(cls)) {
          var val = options[cls];
          if (_typeof(val) == 'object') val = val.title;
          c += '<li role="presentation"><a class="fr-command" tabIndex="-1" role="option" data-cmd="imageStyle" data-param1="' + cls + '">' + this.language.translate(val) + '</a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      this.image.applyStyle(val);
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      var $ = this.$;
      var $current_image = this.image.getEl();

      if ($current_image) {
        $dropdown.find('.fr-command').each(function () {
          var cls = $(this).data('param1');
          var active = $current_image.hasClass(cls);
          $(this).toggleClass('fr-active', active).attr('aria-selected', active);
        });
      }
    }
  }); // Image alt.

  FE.DefineIcon('imageAlt', {
    NAME: 'info',
    SVG_KEY: 'imageAltText'
  });
  FE.RegisterCommand('imageAlt', {
    undo: false,
    focus: false,
    popup: true,
    title: 'Alternative Text',
    callback: function callback() {
      this.image.showAltPopup();
    }
  });
  FE.RegisterCommand('imageSetAlt', {
    undo: true,
    focus: false,
    title: 'Update',
    refreshAfterCallback: false,
    callback: function callback() {
      this.image.setAlt();
    }
  }); // Image size.

  FE.DefineIcon('imageSize', {
    NAME: 'arrows-alt',
    SVG_KEY: 'imageSize'
  });
  FE.RegisterCommand('imageSize', {
    undo: false,
    focus: false,
    popup: true,
    title: 'Change Size',
    callback: function callback() {
      this.image.showSizePopup();
    }
  });
  FE.RegisterCommand('imageSetSize', {
    undo: true,
    focus: false,
    title: 'Update',
    refreshAfterCallback: false,
    callback: function callback() {
      this.image.setSize();
    }
  });
  FE.DefineIcon('imageCaption', {
    NAME: 'commenting',
    FA5NAME: 'comment-alt',
    SVG_KEY: 'imageCaption'
  });
  FE.RegisterCommand('imageCaption', {
    undo: true,
    focus: false,
    title: 'Image Caption',
    refreshAfterCallback: true,
    callback: function callback() {
      this.image.toggleCaption();
    },
    refresh: function refresh($btn) {
      if (this.image.get()) {
        $btn.toggleClass('fr-active', this.image.hasCaption());
      }
    }
  });

  Object.assign(FE.DEFAULTS, {
    imageManagerLoadURL: 'https://i.froala.com/load-files',
    imageManagerLoadMethod: 'get',
    imageManagerLoadParams: {},
    imageManagerPreloader: null,
    imageManagerDeleteURL: '',
    imageManagerDeleteMethod: 'post',
    imageManagerDeleteParams: {},
    imageManagerPageSize: 12,
    imageManagerScrollOffset: 20,
    imageManagerToggleTags: true
  });

  FE.PLUGINS.imageManager = function (editor) {
    var $ = editor.$;
    var $modal;
    var modal_id = 'image_manager';
    var $head;
    var $body;
    var $preloader;
    var $media_files;
    var $image_tags;
    var images;
    var page;
    var image_count;
    var loaded_images;
    var column_number; // Load errors.

    var BAD_LINK = 10;
    var ERROR_DURING_LOAD = 11;
    var MISSING_LOAD_URL_OPTION = 12;
    var LOAD_BAD_RESPONSE = 13;
    var MISSING_IMG_THUMB = 14;
    var MISSING_IMG_URL = 15; // Delete errors

    var ERROR_DURING_DELETE = 21;
    var MISSING_DELETE_URL_OPTION = 22; // Error Messages

    var error_messages = {};
    error_messages[BAD_LINK] = 'Image cannot be loaded from the passed link.';
    error_messages[ERROR_DURING_LOAD] = 'Error during load images request.';
    error_messages[MISSING_LOAD_URL_OPTION] = 'Missing imageManagerLoadURL option.';
    error_messages[LOAD_BAD_RESPONSE] = 'Parsing load response failed.';
    error_messages[MISSING_IMG_THUMB] = 'Missing image thumb.';
    error_messages[MISSING_IMG_URL] = 'Missing image URL.';
    error_messages[ERROR_DURING_DELETE] = 'Error during delete image request.';
    error_messages[MISSING_DELETE_URL_OPTION] = 'Missing imageManagerDeleteURL option.';
    /*
     * Show the image manager.
     */

    function show() {
      // Build the image manager.
      if (!$modal) {
        // Build head.
        var head = "<button class=\"fr-command fr-btn fr-modal-more fr-not-available\" id=\"fr-modal-more-".concat(editor.sid, "\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"\"><path d=\"").concat(FE.SVG.tags, "\"/></svg></button><h4 data-text=\"true\">").concat(editor.language.translate('Manage Images'), "</h4></div>\n      <div class=\"fr-modal-tags\" id=\"fr-modal-tags\">"); // Preloader.

        var body;

        if (editor.opts.imageManagerPreloader) {
          body = '<img class="fr-preloader" id="fr-preloader" alt="' + editor.language.translate('Loading') + '.." src="' + editor.opts.imageManagerPreloader + '" style="display: none;">';
        } else {
          body = '<span class="fr-preloader" id="fr-preloader" style="display: none;">' + editor.language.translate('Loading') + '</span>';
        } // Image list.


        body += '<div class="fr-image-list" id="fr-image-list"></div>';
        var modalHash = editor.modals.create(modal_id, head, body);
        $modal = modalHash.$modal;
        $head = modalHash.$head;
        $body = modalHash.$body;
      } // Set the current image (if modal is opened to replace an image).


      $modal.data('current-image', editor.image.get()); // Show modal.

      editor.modals.show(modal_id);

      if (!$preloader) {
        _delayedInit();
      } // Load images.


      _loadImages();
    }
    /*
     * Hide the image manager.
     */


    function hide() {
      // Hide modal.
      editor.modals.hide(modal_id);
    }
    /*
     * Get the number of columns based on window width.
     */


    function _columnNumber() {
      var window_width = $(window).outerWidth(); // Screen XS.

      if (window_width < 768) {
        return 2;
      } // Screen SM and MD.
      else if (window_width < 1200) {
          return 3;
        } // Screen LG.
        else {
            return 4;
          }
    }
    /*
     * Add the correct number of columns.
     */


    function _buildColumns() {
      $media_files.empty();

      for (var i = 0; i < column_number; i++) {
        $media_files.append('<div class="fr-list-column"></div>');
      }
    }
    /*
     * Load images from server.
     */


    function _loadImages() {
      $preloader.show();
      $media_files.find('.fr-list-column').empty(); // If the images load URL is set.

      if (editor.opts.imageManagerLoadURL) {
        // Make request to get list of images
        $(this).ajax({
          url: editor.opts.imageManagerLoadURL,
          method: editor.opts.imageManagerLoadMethod,
          data: editor.opts.imageManagerLoadParams,
          dataType: 'json',
          crossDomain: editor.opts.requestWithCORS,
          withCredentials: editor.opts.requestWithCredentials,
          headers: editor.opts.requestHeaders,
          // Success
          done: function done(data, status, xhr) {
            editor.events.trigger('imageManager.imagesLoaded', [data]);

            _processLoadedImages(data, xhr.response);

            $preloader.hide();
          },
          // Failure
          fail: function fail(xhr) {
            _throwError(ERROR_DURING_LOAD, xhr.response || xhr.responseText);
          }
        });
      } // Throw missing imageManagerLoadURL option error.
      else {
          _throwError(MISSING_LOAD_URL_OPTION);
        }
    }
    /*
     * Process loaded images.
     */


    function _processLoadedImages(imgs, response) {
      try {
        $media_files.find('.fr-list-column').empty();
        page = 0;
        image_count = 0;
        loaded_images = 0;
        images = imgs; // Load files.

        _infiniteScroll();
      } // Throw error while parsing the response.
      catch (ex) {
        _throwError(LOAD_BAD_RESPONSE, response);
      }
    }
    /*
     * Load more images if necessary.
     */


    function _infiniteScroll() {
      // If there aren't enough images in the modal or if the user scrolls down.
      if (image_count < images.length && ($media_files.outerHeight() <= $body.outerHeight() + editor.opts.imageManagerScrollOffset || $body.scrollTop() + editor.opts.imageManagerScrollOffset > $media_files.outerHeight() - $body.outerHeight())) {
        // Increase page number.
        page++; // Load each image on this page.

        for (var i = editor.opts.imageManagerPageSize * (page - 1); i < Math.min(images.length, editor.opts.imageManagerPageSize * page); i++) {
          _loadImage(images[i]);
        }
      }
    }
    /*
     * Load file.
     */


    function _loadImage(image) {
      var img = new Image();
      var $img_container = $(document.createElement('div')).attr('class', 'fr-image-container fr-empty fr-image-' + loaded_images++).attr('data-loading', editor.language.translate('Loading') + '..').attr('data-deleting', editor.language.translate('Deleting') + '..'); // After adding image empty container modal might change its height.

      _resizeModal(false); // Image has been loaded.


      img.onload = function () {
        // Update image container height.
        $img_container.height(Math.floor($img_container.width() / img.width * img.height)); // Create image HTML.

        var $img = $(document.createElement('img')); // Use image thumb in image manager.

        if (image.thumb) {
          // Set image src attribute/
          $img.attr('src', image.thumb);
        } // Image does not have thumb.
        else {
            // Throw missing image thumb error.
            _throwError(MISSING_IMG_THUMB, image); // Set image URL as src attribute.


            if (image.url) {
              $img.attr('src', image.url);
            } // Missing image URL.
            else {
                // Throw missing image url error.
                _throwError(MISSING_IMG_URL, image); // Don't go further if image does not have a src attribute.


                return false;
              }
          } // Save image URL.


        if (image.url) $img.attr('data-url', image.url); // Image tags.

        if (image.tag) {
          // Show tags only if there are any.
          $head.find('.fr-modal-more.fr-not-available').removeClass('fr-not-available');
          $head.find('.fr-modal-tags').show(); // Image has more than one tag.

          if (image.tag.indexOf(',') >= 0) {
            // Add tags to the image manager tag list.
            var tags = image.tag.split(',');

            for (var i = 0; i < tags.length; i++) {
              // Remove trailing spaces.
              tags[i] = tags[i].trim(); // Add tag.

              if ($image_tags.find('a[title="' + tags[i] + '"]').length === 0) {
                $image_tags.append('<a role="button" title="' + tags[i] + '">' + tags[i] + '</a>');
              }
            } // Set img tag attribute.


            $img.attr('data-tag', tags.join());
          } // Image has only one tag.
          else {
              // Add tag to the tag list.
              if ($image_tags.find('a[title="' + image.tag.trim() + '"]').length === 0) {
                $image_tags.append('<a role="button" title="' + image.tag.trim() + '">' + image.tag.trim() + '</a>');
              } // Set img tag attribute.


              $img.attr('data-tag', image.tag.trim());
            }
        } // Image alt.


        if (image.name) {
          $img.attr('alt', image.name);
        } // Set image additional data.


        for (var key in image) {
          if (image.hasOwnProperty(key)) {
            if (key !== 'thumb' && key !== 'url' && key !== 'tag') {
              $img.attr('data-' + key, image[key]);
            }
          }
        } // Add image and insert and delete buttons to the image container.


        $img_container.append($img).append($(editor.icon.create('imageManagerDelete')).addClass('fr-delete-img').attr('title', editor.language.translate('Delete'))).append($(editor.icon.create('imageManagerInsert')).addClass('fr-insert-img').attr('title', editor.language.translate('Insert'))); // Show image only if it has selected tags.

        $image_tags.find('.fr-selected-tag').each(function (index, tag) {
          if (!_imageHasTag($img, tag.text)) {
            $img_container.hide();
          }
        }); // After an image is loaded the modal may need to be resized.

        $img.on('load', function () {
          // Image container is no longer empty.
          $img_container.removeClass('fr-empty');
          $img_container.height('auto'); // Increase image counter.

          image_count++; // A loded image may break the images order. Reorder them starting with this image.

          var imgs = _getImages(parseInt($img.parent().attr('class').match(/fr-image-(\d+)/)[1], 10) + 1); // Reorder images.


          _reorderImages(imgs); // Image modal may need resizing.


          _resizeModal(false); // If this was the last image on page then we might need to load more.


          if (image_count % editor.opts.imageManagerPageSize === 0) {
            _infiniteScroll();
          }
        }); // Trigger imageLoaded event.

        editor.events.trigger('imageManager.imageLoaded', [$img]);
      }; // Error while loading the image.


      img.onerror = function () {
        image_count++;
        $img_container.remove(); // Removing an image container may break image order.

        var imgs = _getImages(parseInt($img_container.attr('class').match(/fr-image-(\d+)/)[1], 10) + 1); // Reorder images.


        _reorderImages(imgs);

        _throwError(BAD_LINK, image); // If this was the last image on page then we might need to load more.


        if (image_count % editor.opts.imageManagerPageSize === 0) {
          _infiniteScroll();
        }
      }; // Set the image object's src.


      img.src = image.thumb || image.url; // Add loaded or empty image to the media manager image list on the shortest column.

      _shortestColumn().append($img_container);
    }
    /*
     * Get the shortest image column.
     */


    function _shortestColumn() {
      var $col;
      var min_height;
      $media_files.find('.fr-list-column').each(function (index, col) {
        var $column = $(col); // Assume that the first column is the shortest.

        if (index === 0) {
          min_height = $column.outerHeight();
          $col = $column;
        } // Check if another column is shorter.
        else {
            if ($column.outerHeight() < min_height) {
              min_height = $column.outerHeight();
              $col = $column;
            }
          }
      });
      return $col;
    }
    /*
     * Get all images from the image manager.
     */


    function _getImages(from) {
      if (from === undefined) from = 0;
      var get_images = [];

      for (var i = loaded_images - 1; i >= from; i--) {
        var $image = $media_files.find('.fr-image-' + i);

        if ($image.length) {
          get_images.push($image); // Add images here before deleting them so the on load callback is triggered.

          $(document.createElement('div')).attr('id', 'fr-image-hidden-container').append($image);
          $media_files.find('.fr-image-' + i).remove();
        }
      }

      return get_images;
    }
    /*
     * Add images back into the image manager.
     */


    function _reorderImages(imgs) {
      for (var i = imgs.length - 1; i >= 0; i--) {
        _shortestColumn().append(imgs[i]);
      }
    }
    /*
     * Resize the media manager modal if height changes.
     */


    function _resizeModal(infinite_scroll) {
      if (infinite_scroll === undefined) infinite_scroll = true;
      if (!$modal.isVisible()) return true; // If width changes, the number of columns may change.

      var cols = _columnNumber();

      if (cols !== column_number) {
        column_number = cols; // Get all images.

        var imgs = _getImages(); // Remove current columns and add new ones.


        _buildColumns(); // Reorder images.


        _reorderImages(imgs);
      }

      editor.modals.resize(modal_id); // Load more photos when window is resized if necessary.

      if (infinite_scroll) {
        _infiniteScroll();
      }
    }

    function _getImageAttrs($img) {
      var img_attributes = {};
      var img_data = $img.data();

      for (var key in img_data) {
        if (img_data.hasOwnProperty(key)) {
          if (key !== 'url' && key !== 'tag') {
            img_attributes[key] = img_data[key];
          }
        }
      }

      return img_attributes;
    }
    /*
     * Insert image into the editor.
     */


    function _insertImage(e) {
      // Image to insert.
      var $img = $(e.currentTarget).siblings('img');
      var inst = $modal.data('instance') || editor;
      var $current_image = $modal.data('current-image');
      editor.modals.hide(modal_id);
      inst.image.showProgressBar();

      if (!$current_image) {
        // Make sure we have focus.
        inst.events.focus(true);
        inst.selection.restore();
        var rect = inst.position.getBoundingRect();
        var left = rect.left + rect.width / 2 + $(editor.doc).scrollLeft();
        var top = rect.top + rect.height + $(editor.doc).scrollTop(); // Show the image insert popup.

        inst.popups.setContainer('image.insert', editor.$sc);
        inst.popups.show('image.insert', left, top);
      } else {
        $current_image.data('fr-old-src', $current_image.attr('src'));
        $current_image.trigger('click');
      }

      inst.image.insert($img.data('url'), false, _getImageAttrs($img), $current_image);
    }
    /*
     * Update tags.
     */


    function _updateTags() {
      $modal.find('#fr-modal-tags > a').each(function () {
        if ($modal.find('#fr-image-list [data-tag*="' + $(this).text() + '"]').length === 0) {
          $(this).removeClass('fr-selected-tag').hide();
        }
      });

      _showImagesByTags();
    }
    /*
     * Delete image.
     */


    function _deleteImage(e) {
      // Image to delete.
      var $img = $(e.currentTarget).siblings('img'); // Confirmation message.

      var message = editor.language.translate('Are you sure? Image will be deleted.'); // Ask for confirmation.

      if (confirm(message)) {
        // If the images delete URL is set.
        if (editor.opts.imageManagerDeleteURL) {
          // Before delete image event.
          if (editor.events.trigger('imageManager.beforeDeleteImage', [$img]) !== false) {
            $img.parent().addClass('fr-image-deleting'); // Make request to delete image from server.

            $(this).ajax({
              method: editor.opts.imageManagerDeleteMethod,
              url: editor.opts.imageManagerDeleteURL,
              data: Object.assign(Object.assign({
                src: $img.attr('src')
              }, _getImageAttrs($img)), editor.opts.imageManagerDeleteParams),
              crossDomain: editor.opts.requestWithCORS,
              withCredentials: editor.opts.requestWithCredentials,
              headers: editor.opts.requestHeaders,
              // Success function
              done: function done(data, status, xhr) {
                editor.events.trigger('imageManager.imageDeleted', [data]); // A deleted image may break the images order. Reorder them starting with this image.

                var imgs = _getImages(parseInt($img.parent().attr('class').match(/fr-image-(\d+)/)[1], 10) + 1); // Remove the image.


                $img.parent().remove(); // Reorder images.

                _reorderImages(imgs); // Update tags.


                _updateTags(); // Modal needs resizing.


                _resizeModal(true);
              },
              // Failure function
              fail: function fail(xhr) {
                _throwError(ERROR_DURING_DELETE, xhr.response || xhr.responseText);
              }
            });
          }
        } // Throw missing imageManagerDeleteURL option error.
        else {
            _throwError(MISSING_DELETE_URL_OPTION);
          }
      }
    }
    /*
     * Throw image manager errors.
     */


    function _throwError(code, response) {
      // Load images error.
      if (10 <= code && code < 20) {
        // Hide preloader.
        $preloader.hide();
      } // Delete image error.
      else if (20 <= code && code < 30) {
          // Remove deleting overlay.
          $('.fr-image-deleting').removeClass('fr-image-deleting');
        } // Trigger error event.


      editor.events.trigger('imageManager.error', [{
        code: code,
        message: error_messages[code]
      }, response]);
    }
    /*
     * Toogle (show or hide) image tags.
     */


    function _toggleTags() {
      var title_height = $head.find('.fr-modal-head-line').outerHeight();
      var tags_height = $image_tags.outerHeight(); // Use .fr-show-tags.

      $head.toggleClass('fr-show-tags');

      if ($head.hasClass('fr-show-tags')) {
        // Show tags by changing height to have transition.
        $head.css('height', title_height + tags_height); // Shift the body by the same amount as the head

        $body.css('marginTop', title_height + tags_height);
        $image_tags.find('a').css('opacity', 1);
      } else {
        // Hide tags by changing height to have transition.
        $head.css('height', title_height);
        $body.css('marginTop', title_height);
        $image_tags.find('a').css('opacity', 0);
      }
    }
    /*
     * Show only images with selected tags.
     */


    function _showImagesByTags() {
      // Get all selected tags.
      var $tags = $image_tags.find('.fr-selected-tag'); // Show only images with selected tags.

      if ($tags.length > 0) {
        // Hide all images.
        $media_files.find('img').parents().show(); // Show only images with tag.

        $tags.each(function (index, tag) {
          $media_files.find('img').each(function (index, img) {
            var $img = $(img);

            if (!_imageHasTag($img, tag.text)) {
              $img.parent().hide();
            }
          });
        });
      } // There are no more tags selected. Show all images.
      else {
          $media_files.find('img').parents().show();
        } // Rearrange images.


      var imgs = _getImages(); // Reorder images.


      _reorderImages(imgs); // Load more images if necessary.


      _infiniteScroll();
    }
    /*
     * Select an image tag from the list.
     */


    function _selectTag(e) {
      e.preventDefault(); // Toggle current tags class.

      var $tag = $(e.currentTarget);
      $tag.toggleClass('fr-selected-tag'); // Toggle selected tags.

      if (editor.opts.imageManagerToggleTags) $tag.siblings('a').removeClass('fr-selected-tag'); // Change displayed images.

      _showImagesByTags();
    }
    /*
     * Method to check if an image has a specific tag.
     */


    function _imageHasTag($image, tag) {
      var tags = ($image.attr('data-tag') || '').split(',');

      for (var i = 0; i < tags.length; i++) {
        if (tags[i] === tag) {
          return true;
        }
      }

      return false;
    }

    function _delayedInit() {
      $preloader = $modal.find('#fr-preloader');
      $media_files = $modal.find('#fr-image-list');
      $image_tags = $modal.find('#fr-modal-tags'); // Columns.

      column_number = _columnNumber();

      _buildColumns(); // Set height for title (we need this for show tags transition).


      $head.css('height', $head.find('.fr-modal-head-line').outerHeight()); // Resize media manager modal on window resize.

      editor.events.$on($(editor.o_win), 'resize', function () {
        // Window resize with image manager opened.
        if (images) {
          _resizeModal(true);
        } // iOS window resize is triggered when modal first opens (no images loaded).
        else {
            _resizeModal(false);
          }
      }); // Insert image.

      editor.events.bindClick($media_files, '.fr-insert-img', _insertImage); // Delete image.

      editor.events.bindClick($media_files, '.fr-delete-img', _deleteImage); // Delete and insert buttons for mobile.

      if (editor.helpers.isMobile()) {
        // Show image buttons on mobile.
        editor.events.bindClick($media_files, 'div.fr-image-container', function (e) {
          $modal.find('.fr-mobile-selected').removeClass('fr-mobile-selected');
          $(e.currentTarget).addClass('fr-mobile-selected');
        }); // Hide image buttons if we click outside it.

        $modal.on(editor._mousedown, function () {
          $modal.find('.fr-mobile-selected').removeClass('fr-mobile-selected');
        });
      } // Make sure we don't trigger blur.


      $modal.on(editor._mousedown + ' ' + editor._mouseup, function (e) {
        e.stopPropagation();
      }); // Mouse down on anything.

      $modal.on(editor._mousedown, '*', function () {
        editor.events.disableBlur();
      }); // Infinite scroll

      $body.on('scroll', _infiniteScroll); // Click on image tags button.

      editor.events.bindClick($modal, 'button#fr-modal-more-' + editor.sid, _toggleTags); // Select an image tag.

      editor.events.bindClick($image_tags, 'a', _selectTag);
    }
    /*
     * Init media manager.
     */


    function _init() {
      if (!editor.$wp && editor.el.tagName !== 'IMG') return false;
    }

    return {
      require: ['image'],
      _init: _init,
      show: show,
      hide: hide
    };
  };

  if (!FE.PLUGINS.image) {
    throw new Error('Image manager plugin requires image plugin.');
  }

  FE.DEFAULTS.imageInsertButtons.push('imageManager');
  FE.RegisterCommand('imageManager', {
    title: 'Browse',
    undo: false,
    focus: false,
    modal: true,
    callback: function callback() {
      this.imageManager.show();
    },
    plugin: 'imageManager'
  }); // Add the font size icon.

  FE.DefineIcon('imageManager', {
    NAME: 'folder',
    SVG_KEY: 'imageManager'
  }); // Add the font size icon.

  FE.DefineIcon('imageManagerInsert', {
    NAME: 'plus',
    SVG_KEY: 'add'
  }); // Add the font size icon.

  FE.DefineIcon('imageManagerDelete', {
    NAME: 'trash',
    SVG_KEY: 'remove'
  });

  Object.assign(FE.DEFAULTS, {
    inlineClasses: {
      'fr-class-code': 'Code',
      'fr-class-highlighted': 'Highlighted',
      'fr-class-transparency': 'Transparent'
    }
  });

  FE.PLUGINS.inlineClass = function (editor) {
    var $ = editor.$;

    function apply(val) {
      editor.format.toggle('span', {
        'class': val
      });
    }

    function refreshOnShow($btn, $dropdown) {
      $dropdown.find('.fr-command').each(function () {
        var val = $(this).data('param1');
        var active = editor.format.is('span', {
          'class': val
        });
        $(this).toggleClass('fr-active', active).attr('aria-selected', active);
      });
    }

    return {
      apply: apply,
      refreshOnShow: refreshOnShow
    };
  }; // Register the inlineClass size command.


  FE.RegisterCommand('inlineClass', {
    type: 'dropdown',
    title: 'Inline Class',
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = this.opts.inlineClasses;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          c += '<li role="presentation"><a class="fr-command" tabIndex="-1" role="option" data-cmd="inlineClass" data-param1="' + val + '" title="' + options[val] + '">' + options[val] + '</a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      this.inlineClass.apply(val);
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      this.inlineClass.refreshOnShow($btn, $dropdown);
    },
    plugin: 'inlineClass'
  }); // Add the inlineClass icon.

  FE.DefineIcon('inlineClass', {
    NAME: 'tag',
    SVG_KEY: 'inlineClass'
  });

  Object.assign(FE.DEFAULTS, {
    inlineStyles: {
      'Big Red': 'font-size: 20px; color: red;',
      'Small Blue': 'font-size: 14px; color: blue;'
    }
  });

  FE.PLUGINS.inlineStyle = function (editor) {
    function apply(val) {
      if (editor.selection.text() !== '') {
        var splits = val.split(';');

        for (var i = 0; i < splits.length; i++) {
          var new_split = splits[i].split(':');

          if (splits[i].length && new_split.length == 2) {
            editor.format.applyStyle(new_split[0].trim(), new_split[1].trim());
          }
        }
      } else {
        editor.html.insert('<span style="' + val + '">' + FE.INVISIBLE_SPACE + FE.MARKERS + '</span>');
      }
    }

    return {
      apply: apply
    };
  }; // Register the inline style command.


  FE.RegisterCommand('inlineStyle', {
    type: 'dropdown',
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = this.opts.inlineStyles;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          var inlineStyle = options[val] + (options[val].indexOf('display:block;') === -1 ? ' display:block;' : '');
          c += '<li role="presentation"><span style="' + inlineStyle + '" role="presentation"><a class="fr-command" tabIndex="-1" role="option" data-cmd="inlineStyle" data-param1="' + options[val] + '" title="' + this.language.translate(val) + '">' + this.language.translate(val) + '</a></span></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    title: 'Inline Style',
    callback: function callback(cmd, val) {
      this.inlineStyle.apply(val);
    },
    plugin: 'inlineStyle'
  }); // Add the font size icon.

  FE.DefineIcon('inlineStyle', {
    NAME: 'paint-brush',
    SVG_KEY: 'inlineStyle'
  });

  Object.assign(FE.DEFAULTS, {
    lineBreakerTags: ['table', 'hr', 'form', 'dl', 'span.fr-video', '.fr-embedly', 'img'],
    lineBreakerOffset: 15,
    lineBreakerHorizontalOffset: 10
  });

  FE.PLUGINS.lineBreaker = function (editor) {
    var $ = editor.$;
    var $line_breaker;
    var mouseDownFlag;
    var mouseMoveTimer;
    /*
     * Show line breaker.
     * Compute top, left, width and show the line breaker.
     * tag1 and tag2 are the tags between which the line breaker must be showed.
     * If tag1 is null then tag2 is the first tag in the editor.
     * If tag2 is null then tag1 is the last tag in the editor.
     */

    function _show($tag1, $tag2) {
      // Line breaker's possition and width.
      var breakerTop;
      var breakerLeft;
      var breakerWidth;
      var parent_tag;
      var parent_top;
      var parent_bottom;
      var tag_top;
      var tag_bottom; // Mouse is over the first tag in the editor. Show line breaker above tag2.

      if ($tag1 == null) {
        // Compute line breaker's possition and width.
        parent_tag = $tag2.parent();
        parent_top = parent_tag.offset().top;
        tag_top = $tag2.offset().top;
        breakerTop = tag_top - Math.min((tag_top - parent_top) / 2, editor.opts.lineBreakerOffset);
        breakerWidth = parent_tag.outerWidth();
        breakerLeft = parent_tag.offset().left;
      } // Mouse is over the last tag in the editor. Show line breaker below tag1.
      else if ($tag2 == null) {
          // Compute line breaker's possition and width.
          parent_tag = $tag1.parent();
          parent_bottom = parent_tag.offset().top + parent_tag.outerHeight();
          tag_bottom = $tag1.offset().top + $tag1.outerHeight();

          if (parent_bottom < tag_bottom) {
            parent_tag = $(parent_tag).parent();
            parent_bottom = parent_tag.offset().top + parent_tag.outerHeight();
          }

          breakerTop = tag_bottom + Math.min(Math.abs(parent_bottom - tag_bottom) / 2, editor.opts.lineBreakerOffset);
          breakerWidth = parent_tag.outerWidth();
          breakerLeft = parent_tag.offset().left;
        } // Mouse is between the 2 tags.
        else {
            // Compute line breaker's possition and width.
            parent_tag = $tag1.parent();
            var tag1_bottom = $tag1.offset().top + $tag1.height();
            var tag2_top = $tag2.offset().top; // Tags may be on the same line, so there is no need for line breaker.

            if (tag1_bottom > tag2_top) {
              return false;
            }

            breakerTop = (tag1_bottom + tag2_top) / 2;
            breakerWidth = parent_tag.outerWidth();
            breakerLeft = parent_tag.offset().left;
          }

      if (editor.opts.iframe) {
        var iframePaddingTop = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-top'));
        var iframePaddingLeft = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-left'));
        breakerLeft += editor.$iframe.offset().left - editor.helpers.scrollLeft() + iframePaddingLeft;
        breakerTop += editor.$iframe.offset().top - editor.helpers.scrollTop() + iframePaddingTop;
      }

      editor.$box.append($line_breaker); // Set line breaker's top, left and width.

      $line_breaker.css('top', breakerTop - editor.win.pageYOffset);
      $line_breaker.css('left', breakerLeft - editor.win.pageXOffset);
      $line_breaker.css('width', breakerWidth);
      $line_breaker.data('tag1', $tag1);
      $line_breaker.data('tag2', $tag2); // Show the line breaker.

      $line_breaker.addClass('fr-visible').data('instance', editor);
    }
    /*
     * Check tag siblings.
     * The line breaker hould appear if there is no sibling or if the sibling is also in the line breaker tags list.
     */


    function _checkTagSiblings($tag, mouseY) {
      // Tag's Y top and bottom coordinate.
      var tag_top = $tag.offset().top;
      var tag_bottom = $tag.offset().top + $tag.outerHeight();
      var $sibling;
      var tag; // Only if the mouse is close enough to the bottom or top edges.

      if (Math.abs(tag_bottom - mouseY) <= editor.opts.lineBreakerOffset || Math.abs(mouseY - tag_top) <= editor.opts.lineBreakerOffset) {
        // Mouse is near bottom check for next sibling.
        if (Math.abs(tag_bottom - mouseY) < Math.abs(mouseY - tag_top)) {
          tag = $tag.get(0);
          var next_node = tag.nextSibling;

          while (next_node && next_node.nodeType == Node.TEXT_NODE && next_node.textContent.length === 0) {
            next_node = next_node.nextSibling;
          } // Tag has next sibling.


          if (next_node) {
            $sibling = _checkTag(next_node); // Sibling is in the line breaker tags list.

            if ($sibling) {
              // Show line breaker.
              _show($tag, $sibling);

              return true;
            } // No next sibling.

          } else {
            // Show line breaker
            _show($tag, null);

            return true;
          }
        } // Mouse is near top check for prev sibling.
        else {
            tag = $tag.get(0); // No prev sibling.

            if (!tag.previousSibling) {
              // Show line breaker
              _show(null, $tag);

              return true; // Tag has prev sibling.
            } else {
              $sibling = _checkTag(tag.previousSibling); // Sibling is in the line breaker tags list.

              if ($sibling) {
                // Show line breaker.
                _show($sibling, $tag);

                return true;
              }
            }
          }
      }

      $line_breaker.removeClass('fr-visible').removeData('instance');
    }
    /*
     * Check if tag is in the line breaker list and in the editor as well.
     * Returns the tag from the line breaker list or false if the tag is not in the list.
     */


    function _checkTag(tag) {
      if (tag) {
        var $tag = $(tag); // Make sure tag is inside the editor.

        if (editor.$el.find($tag).length === 0) return null; // Tag is in the line breaker tags list.

        if (tag.nodeType != Node.TEXT_NODE && $tag.is(editor.opts.lineBreakerTags.join(','))) {
          return $tag;
        } // Tag's parent is in the line breaker tags list.
        else if ($tag.parents(editor.opts.lineBreakerTags.join(',')).length > 0) {
            tag = $tag.parents(editor.opts.lineBreakerTags.join(',')).get(0);
            if (editor.$el.find($(tag)).length === 0 || !$(tag).is(editor.opts.lineBreakerTags.join(','))) return null;
            return $(tag);
          }
      }

      return null;
    }

    function _isInWp(tag) {
      if (typeof tag.inFroalaWrapper != 'undefined') return tag.inFroalaWrapper;
      var o_tag = tag;

      while (tag.parentNode && tag.parentNode !== editor.$wp.get(0)) {
        tag = tag.parentNode;
      }

      o_tag.inFroalaWrapper = tag.parentNode == editor.$wp.get(0);
      return o_tag.inFroalaWrapper;
    }
    /*
     * Look for tag at the specified coordinates.
     */


    function _tagAt(x, y) {
      var tag = editor.doc.elementFromPoint(x, y); // We found a tag.

      if (tag && !$(tag).closest('.fr-line-breaker').length && !editor.node.isElement(tag) && tag != editor.$wp.get(0) && _isInWp(tag)) {
        return tag;
      } // No tag at x, y.


      return null;
    }
    /*
     * Look for tags above and bellow the specificed point.
     */


    function _searchTagVertically(x, y, step) {
      var i = step;
      var tag = null; // Look up and down until a tag is found or the line breaker offset is reached.

      while (i <= editor.opts.lineBreakerOffset && !tag) {
        // Look for tag above.
        tag = _tagAt(x, y - i);

        if (!tag) {
          // Look for tag below.
          tag = _tagAt(x, y + i);
        }

        i += step;
      }

      return tag;
    }
    /*
     * Look for tag left and right, up and down for each point.
     */


    function _searchTagHorizontally(x, y, direction) {
      var tag = null; // Do not check left / right too much.

      var limit = 100; // Look left / right until a tag is found or the editor margins are reached.

      while (!tag && x > editor.$box.offset().left && x < editor.$box.offset().left + editor.$box.outerWidth() && limit > 0) {
        tag = _tagAt(x, y); // There's not tag here, look up and down.

        if (!tag) {
          // Look 5px up and 5 down.
          tag = _searchTagVertically(x, y, 5);
        } // Move left or right.


        if (direction == 'left') x -= editor.opts.lineBreakerHorizontalOffset;else x += editor.opts.lineBreakerHorizontalOffset;
        limit -= editor.opts.lineBreakerHorizontalOffset;
      }

      return tag;
    }
    /*
     * Get the tag under the mouse cursor.
     */


    function _tagUnder(e) {
      mouseMoveTimer = null; // The tag for which the line breaker should be showed.

      var $tag = null;
      var tag = null; // The tag under the mouse cursor.

      var tag_under = editor.doc.elementFromPoint(e.pageX - editor.win.pageXOffset, e.pageY - editor.win.pageYOffset); // Tag is the editor element. Look for closest tag above and bellow, left and right.

      if (tag_under && (tag_under.tagName == 'HTML' || tag_under.tagName == 'BODY' || editor.node.isElement(tag_under) || (tag_under.getAttribute('class') || '').indexOf('fr-line-breaker') >= 0)) {
        // Look 1px up and 1 down.
        tag = _searchTagVertically(e.pageX - editor.win.pageXOffset, e.pageY - editor.win.pageYOffset, 1); // Stil haven't found a tag, look left.

        if (!tag) {
          tag = _searchTagHorizontally(e.pageX - editor.win.pageXOffset - editor.opts.lineBreakerHorizontalOffset, e.pageY - editor.win.pageYOffset, 'left');
        } // Stil haven't found a tag, look right.


        if (!tag) {
          tag = _searchTagHorizontally(e.pageX - editor.win.pageXOffset + editor.opts.lineBreakerHorizontalOffset, e.pageY - editor.win.pageYOffset, 'right');
        }

        $tag = _checkTag(tag); // Tag is not the editor element.
      } else {
        // Check if the tag is in the line breaker list.
        $tag = _checkTag(tag_under);
      } // Check tag siblings.


      if ($tag) {
        _checkTagSiblings($tag, e.pageY);
      } else if (editor.core.sameInstance($line_breaker)) {
        $line_breaker.removeClass('fr-visible').removeData('instance');
      }
    }
    /*
     * Set mouse timer to improve performance.
     */


    function _mouseTimer(e) {
      if ($line_breaker.hasClass('fr-visible') && !editor.core.sameInstance($line_breaker)) return false;

      if (editor.popups.areVisible() || editor.el.querySelector('.fr-selected-cell')) {
        $line_breaker.removeClass('fr-visible');
        return true;
      }

      if (mouseDownFlag === false && !editor.edit.isDisabled()) {
        if (mouseMoveTimer) {
          clearTimeout(mouseMoveTimer);
        }

        mouseMoveTimer = setTimeout(_tagUnder, 30, e);
      }
    }
    /*
     * Hide line breaker and prevent timer from showing it again.
     */


    function _hide() {
      if (mouseMoveTimer) {
        clearTimeout(mouseMoveTimer);
      }

      if ($line_breaker && $line_breaker.hasClass('fr-visible')) {
        $line_breaker.removeClass('fr-visible').removeData('instance');
      }
    }
    /*
     * Notify that mouse is down and prevent line breaker from showing.
     * This may happen either for selection or for drag.
     */


    function _mouseDown() {
      mouseDownFlag = true;

      _hide();
    }
    /*
     * Notify that mouse is no longer pressed.
     */


    function _mouseUp() {
      mouseDownFlag = false;
    }
    /*
     * Add new line between the tags.
     */


    function _doLineBreak(e) {
      e.preventDefault();
      var instance = $line_breaker.data('instance') || editor; // Hide the line breaker.

      $line_breaker.removeClass('fr-visible').removeData('instance'); // Tags between which that line break needs to be done.

      var $tag1 = $line_breaker.data('tag1');
      var $tag2 = $line_breaker.data('tag2'); // P, DIV or none.

      var default_tag = editor.html.defaultTag(); // The line break needs to be done before the first element in the editor.

      if ($tag1 == null) {
        // If the tag is in a TD tag then just add <br> no matter what the default_tag is.
        if (default_tag && $tag2.parent().get(0).tagName != 'TD' && $tag2.parents(default_tag).length === 0) {
          $tag2.before('<' + default_tag + '>' + FE.MARKERS + '<br></' + default_tag + '>');
        } else {
          $tag2.before(FE.MARKERS + '<br>');
        } // The line break needs to be done either after the last element in the editor or between the 2 tags.
        // Either way the line break is after the first tag.

      } else {
        // If the tag is in a TD tag then just add <br> no matter what the default_tag is.
        if (default_tag && $tag1.parent().get(0).tagName != 'TD' && $tag1.parents(default_tag).length === 0) {
          $tag1.after('<' + default_tag + '>' + FE.MARKERS + '<br></' + default_tag + '>');
        } else {
          $tag1.after(FE.MARKERS + '<br>');
        }
      } // Cursor is now at the beginning of the new line.


      instance.selection.restore(); // https://github.com/froala-labs/froala-editor-js-2/issues/1571
      // enable toolbar if it is disabled because of contenteditable=false

      editor.toolbar.enable();
    }
    /*
     * Initialize the line breaker.
     */


    function _initLineBreaker() {
      // Append line breaker HTML to editor wrapper.
      if (!editor.shared.$line_breaker) {
        editor.shared.$line_breaker = $(document.createElement('div')).attr('class', 'fr-line-breaker').html('<a class="fr-floating-btn" role="button" tabIndex="-1" title="' + editor.language.translate('Break') + '"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="17" y="7" width="2" height="8"/><rect x="10" y="13" width="7" height="2"/><path d="M10.000,10.000 L10.000,18.013 L5.000,14.031 L10.000,10.000 Z"/></svg></a>');
      }

      $line_breaker = editor.shared.$line_breaker; // Editor shared destroy.

      editor.events.on('shared.destroy', function () {
        $line_breaker.html('').removeData().remove();
        $line_breaker = null;
      }, true); // Editor destroy.

      editor.events.on('destroy', function () {
        $line_breaker.removeData('instance').removeClass('fr-visible');
        $('body').first().append($line_breaker);
        clearTimeout(mouseMoveTimer);
      }, true);
      editor.events.$on($line_breaker, 'mousemove', function (e) {
        e.stopPropagation();
      }, true); // Add new line break.

      editor.events.bindClick($line_breaker, 'a', _doLineBreak);
    }
    /*
     * Tear up.
     */


    function _init() {
      if (!editor.$wp) return false;

      _initLineBreaker(); // Remember if mouse is clicked so the line breaker does not appear.


      mouseDownFlag = false; // Check tags under the mouse to see if the line breaker needs to be shown.

      editor.events.$on(editor.$win, 'mousemove', _mouseTimer); // Hide the line breaker if the page is scrolled.

      editor.events.$on($(editor.win), 'scroll', _hide); // Hide the line breaker on cell edit.

      editor.events.on('popups.show.table.edit', _hide); // Hide the line breaker after command is ran.

      editor.events.on('commands.after', _hide); // Prevent line breaker from showing while selecting text or dragging images.

      editor.events.$on($(editor.win), 'mousedown', _mouseDown); // Mouse is not pressed anymore, line breaker may be shown.

      editor.events.$on($(editor.win), 'mouseup', _mouseUp);
    }

    return {
      _init: _init
    };
  };

  Object.assign(FE.DEFAULTS, {
    lineHeights: {
      Default: '',
      Single: '1',
      '1.15': '1.15',
      '1.5': '1.5',
      Double: '2'
    }
  });

  FE.PLUGINS.lineHeight = function (editor) {
    var $ = editor.$;
    /**
     * Apply style.
     */

    function apply(val) {
      editor.selection.save();
      editor.html.wrap(true, true, true, true);
      editor.selection.restore();
      var blocks = editor.selection.blocks();

      if (blocks.length && $(blocks[0]).parent().is('td')) {
        editor.format.applyStyle('line-height', val.toString());
      } // Save selection to restore it later.


      editor.selection.save();

      for (var i = 0; i < blocks.length; i++) {
        $(blocks[i]).css('line-height', val);

        if ($(blocks[i]).attr('style') === '') {
          $(blocks[i]).removeAttr('style');
        }
      } // Unwrap temp divs.


      editor.html.unwrap(); // Restore selection.

      editor.selection.restore();
    }

    function refreshOnShow($btn, $dropdown) {
      var blocks = editor.selection.blocks();

      if (blocks.length) {
        var $blk = $(blocks[0]);
        $dropdown.find('.fr-command').each(function () {
          var lineH = $(this).data('param1');
          var active = ($blk.attr('style') || '').indexOf('line-height: ' + lineH + ';') >= 0;
          $(this).toggleClass('fr-active', active).attr('aria-selected', active);
        });
      }
    }

    function _init() {}

    return {
      _init: _init,
      apply: apply,
      refreshOnShow: refreshOnShow
    };
  }; // Register the font size command.


  FE.RegisterCommand('lineHeight', {
    type: 'dropdown',
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = this.opts.lineHeights;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          c += '<li role="presentation"><a class="fr-command ' + val + '" tabIndex="-1" role="option" data-cmd="lineHeight" data-param1="' + options[val] + '" title="' + this.language.translate(val) + '">' + this.language.translate(val) + '</a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    title: 'Line Height',
    callback: function callback(cmd, val) {
      this.lineHeight.apply(val);
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      this.lineHeight.refreshOnShow($btn, $dropdown);
    },
    plugin: 'lineHeight'
  }); // Add the font size icon.

  FE.DefineIcon('lineHeight', {
    NAME: 'arrows-v',
    FA5NAME: 'arrows-alt-v',
    SVG_KEY: 'lineHeight'
  });

  Object.assign(FE.POPUP_TEMPLATES, {
    'link.edit': '[_BUTTONS_]',
    'link.insert': '[_BUTTONS_][_INPUT_LAYER_]'
  }); // Extend defaults.

  Object.assign(FE.DEFAULTS, {
    linkEditButtons: ['linkOpen', 'linkStyle', 'linkEdit', 'linkRemove'],
    linkInsertButtons: ['linkBack', '|', 'linkList'],
    linkAttributes: {},
    linkAutoPrefix: 'http://',
    linkStyles: {
      'fr-green': 'Green',
      'fr-strong': 'Thick'
    },
    linkMultipleStyles: true,
    linkConvertEmailAddress: true,
    linkAlwaysBlank: false,
    linkAlwaysNoFollow: false,
    linkNoOpener: true,
    linkNoReferrer: true,
    linkList: [{
      text: 'Froala',
      href: 'https://froala.com',
      target: '_blank'
    }, {
      text: 'Google',
      href: 'https://google.com',
      target: '_blank'
    }, {
      displayText: 'Facebook',
      href: 'https://facebook.com'
    }],
    linkText: true
  });

  FE.PLUGINS.link = function (editor) {
    var $ = editor.$;

    function get() {
      var $current_image = editor.image ? editor.image.get() : null;

      if (!$current_image && editor.$wp) {
        var c_el = editor.selection.ranges(0).commonAncestorContainer;

        try {
          if (c_el && (c_el.contains && c_el.contains(editor.el) || !editor.el.contains(c_el) || editor.el == c_el)) c_el = null;
        } catch (ex) {
          c_el = null;
        }

        if (c_el && c_el.tagName === 'A') return c_el;
        var s_el = editor.selection.element();
        var e_el = editor.selection.endElement();

        if (s_el.tagName != 'A' && !editor.node.isElement(s_el)) {
          s_el = $(s_el).parentsUntil(editor.$el, 'a').first().get(0);
        }

        if (e_el.tagName != 'A' && !editor.node.isElement(e_el)) {
          e_el = $(e_el).parentsUntil(editor.$el, 'a').first().get(0);
        }

        try {
          if (e_el && (e_el.contains && e_el.contains(editor.el) || !editor.el.contains(e_el) || editor.el == e_el)) e_el = null;
        } catch (ex) {
          e_el = null;
        }

        try {
          if (s_el && (s_el.contains && s_el.contains(editor.el) || !editor.el.contains(s_el) || editor.el == s_el)) s_el = null;
        } catch (ex) {
          s_el = null;
        }

        if (e_el && e_el == s_el && e_el.tagName == 'A') {
          // We do not clicking at the end / input of links because in IE the selection is changing shortly after mouseup.
          // https://jsfiddle.net/jredzam3/
          if ((editor.browser.msie || editor.helpers.isMobile()) && (editor.selection.info(s_el).atEnd || editor.selection.info(s_el).atStart)) {
            return null;
          }

          return s_el;
        }

        return null;
      } else if (editor.el.tagName == 'A') {
        return editor.el;
      } else {
        if ($current_image && $current_image.get(0).parentNode && $current_image.get(0).parentNode.tagName == 'A') {
          return $current_image.get(0).parentNode;
        }
      }
    }

    function allSelected() {
      var $current_image = editor.image ? editor.image.get() : null;
      var selectedLinks = [];

      if ($current_image) {
        if ($current_image.get(0).parentNode.tagName == 'A') {
          selectedLinks.push($current_image.get(0).parentNode);
        }
      } else {
        var range;
        var containerEl;
        var links;
        var linkRange;

        if (editor.win.getSelection) {
          var sel = editor.win.getSelection();

          if (sel.getRangeAt && sel.rangeCount) {
            linkRange = editor.doc.createRange();

            for (var r = 0; r < sel.rangeCount; ++r) {
              range = sel.getRangeAt(r);
              containerEl = range.commonAncestorContainer;

              if (containerEl && containerEl.nodeType != 1) {
                containerEl = containerEl.parentNode;
              }

              if (containerEl && containerEl.nodeName.toLowerCase() == 'a') {
                selectedLinks.push(containerEl);
              } else {
                links = containerEl.getElementsByTagName('a');

                for (var i = 0; i < links.length; ++i) {
                  linkRange.selectNodeContents(links[i]);

                  if (linkRange.compareBoundaryPoints(range.END_TO_START, range) < 1 && linkRange.compareBoundaryPoints(range.START_TO_END, range) > -1) {
                    selectedLinks.push(links[i]);
                  }
                }
              }
            } // linkRange.detach() 

          }
        } else if (editor.doc.selection && editor.doc.selection.type != 'Control') {
          range = editor.doc.selection.createRange();
          containerEl = range.parentElement();

          if (containerEl.nodeName.toLowerCase() == 'a') {
            selectedLinks.push(containerEl);
          } else {
            links = containerEl.getElementsByTagName('a');
            linkRange = editor.doc.body.createTextRange();

            for (var j = 0; j < links.length; ++j) {
              linkRange.moveToElementText(links[j]);

              if (linkRange.compareEndPoints('StartToEnd', range) > -1 && linkRange.compareEndPoints('EndToStart', range) < 1) {
                selectedLinks.push(links[j]);
              }
            }
          }
        }
      }

      return selectedLinks;
    }

    function _edit(e) {
      if (editor.core.hasFocus()) {
        _hideEditPopup(); // Do not show edit popup for link when ALT is hit.


        if (e && e.type === 'keyup' && (e.altKey || e.which == FE.KEYCODE.ALT)) return true;
        setTimeout(function () {
          // No event passed.
          // Event passed and (left click or other event type).
          if (!e || e && (e.which == 1 || e.type != 'mouseup')) {
            var link = get();
            var $current_image = editor.image ? editor.image.get() : null;

            if (link && !$current_image) {
              if (editor.image) {
                var contents = editor.node.contents(link); // https://github.com/froala/wysiwyg-editor/issues/1103

                if (contents.length == 1 && contents[0].tagName == 'IMG') {
                  var range = editor.selection.ranges(0);

                  if (range.startOffset === 0 && range.endOffset === 0) {
                    $(link).before(FE.MARKERS);
                  } else {
                    $(link).after(FE.MARKERS);
                  }

                  editor.selection.restore();
                  return false;
                }
              }

              if (e) {
                e.stopPropagation();
              }

              _showEditPopup(link);
            }
          }
        }, editor.helpers.isIOS() ? 100 : 0);
      }
    }

    function _showEditPopup(link) {
      var $popup = editor.popups.get('link.edit');
      if (!$popup) $popup = _initEditPopup();
      var $link = $(link);

      if (!editor.popups.isVisible('link.edit')) {
        editor.popups.refresh('link.edit');
      }

      editor.popups.setContainer('link.edit', editor.$sc);
      var left = $link.offset().left + $link.outerWidth() / 2;
      var top = $link.offset().top + $link.outerHeight();
      editor.popups.show('link.edit', left, top, $link.outerHeight(), true);
    }

    function _hideEditPopup() {
      editor.popups.hide('link.edit');
    }

    function _initEditPopup() {
      // Link buttons.
      var link_buttons = '';

      if (editor.opts.linkEditButtons.length >= 1) {
        if (editor.el.tagName == 'A' && editor.opts.linkEditButtons.indexOf('linkRemove') >= 0) {
          editor.opts.linkEditButtons.splice(editor.opts.linkEditButtons.indexOf('linkRemove'), 1);
        }

        link_buttons = "<div class=\"fr-buttons\">".concat(editor.button.buildList(editor.opts.linkEditButtons), "</div>");
      }

      var template = {
        buttons: link_buttons // Set the template in the popup.

      };
      var $popup = editor.popups.create('link.edit', template);

      if (editor.$wp) {
        editor.events.$on(editor.$wp, 'scroll.link-edit', function () {
          if (get() && editor.popups.isVisible('link.edit')) {
            _showEditPopup(get());
          }
        });
      }

      return $popup;
    }
    /**
     * Hide link insert popup.
     */


    function _refreshInsertPopup() {
      var $popup = editor.popups.get('link.insert');
      var link = get();

      if (link) {
        var $link = $(link);
        var text_inputs = $popup.find('input.fr-link-attr[type="text"]');
        var check_inputs = $popup.find('input.fr-link-attr[type="checkbox"]');
        var i;
        var $input;

        for (i = 0; i < text_inputs.length; i++) {
          $input = $(text_inputs[i]);
          $input.val($link.attr($input.attr('name') || ''));
        }

        check_inputs.attr('checked', false);

        for (i = 0; i < check_inputs.length; i++) {
          $input = $(check_inputs[i]);

          if ($link.attr($input.attr('name')) == $input.data('checked')) {
            $input.attr('checked', true);
          }
        }

        $popup.find('input.fr-link-attr[type="text"][name="text"]').val($link.text());
      } else {
        $popup.find('input.fr-link-attr[type="text"]').val('');
        $popup.find('input.fr-link-attr[type="checkbox"]').attr('checked', false);
        $popup.find('input.fr-link-attr[type="text"][name="text"]').val(editor.selection.text());
      }

      $popup.find('input.fr-link-attr').trigger('change');
      var $current_image = editor.image ? editor.image.get() : null;

      if ($current_image) {
        $popup.find('.fr-link-attr[name="text"]').parent().hide();
      } else {
        $popup.find('.fr-link-attr[name="text"]').parent().show();
      }
    }

    function _showInsertPopup() {
      var $btn = editor.$tb.find('.fr-command[data-cmd="insertLink"]');
      var $popup = editor.popups.get('link.insert');
      if (!$popup) $popup = _initInsertPopup();

      if (!$popup.hasClass('fr-active')) {
        editor.popups.refresh('link.insert');
        editor.popups.setContainer('link.insert', editor.$tb || editor.$sc);

        if ($btn.isVisible()) {
          var _editor$button$getPos = editor.button.getPosition($btn),
              left = _editor$button$getPos.left,
              top = _editor$button$getPos.top;

          editor.popups.show('link.insert', left, top, $btn.outerHeight());
        } else {
          editor.position.forSelection($popup);
          editor.popups.show('link.insert');
        }
      }
    }

    function _initInsertPopup(delayed) {
      if (delayed) {
        editor.popups.onRefresh('link.insert', _refreshInsertPopup);
        return true;
      } // Image buttons.


      var link_buttons = '';

      if (editor.opts.linkInsertButtons.length >= 1) {
        link_buttons = '<div class="fr-buttons fr-tabs">' + editor.button.buildList(editor.opts.linkInsertButtons) + '</div>';
      }

      var checkmark = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10" viewBox="0 0 32 32"><path d="M27 4l-15 15-7-7-5 5 12 12 20-20z" fill="#FFF"></path></svg>'; // Image by url layer.

      var input_layer = '';
      var tab_idx = 0;
      input_layer = '<div class="fr-link-insert-layer fr-layer fr-active" id="fr-link-insert-layer-' + editor.id + '">';
      input_layer += '<div class="fr-input-line"><input id="fr-link-insert-layer-url-' + editor.id + '" name="href" type="text" class="fr-link-attr" placeholder="' + editor.language.translate('URL') + '" tabIndex="' + ++tab_idx + '"></div>';

      if (editor.opts.linkText) {
        input_layer += '<div class="fr-input-line"><input id="fr-link-insert-layer-text-' + editor.id + '" name="text" type="text" class="fr-link-attr" placeholder="' + editor.language.translate('Text') + '" tabIndex="' + ++tab_idx + '"></div>';
      } // Add any additional fields.


      for (var attr in editor.opts.linkAttributes) {
        if (editor.opts.linkAttributes.hasOwnProperty(attr)) {
          var placeholder = editor.opts.linkAttributes[attr];
          input_layer += '<div class="fr-input-line"><input name="' + attr + '" type="text" class="fr-link-attr" placeholder="' + editor.language.translate(placeholder) + '" tabIndex="' + ++tab_idx + '"></div>';
        }
      }

      if (!editor.opts.linkAlwaysBlank) {
        input_layer += "<div class=\"fr-checkbox-line\"><span class=\"fr-checkbox\"><input name=\"target\" class=\"fr-link-attr\" data-checked=\"_blank\" type=\"checkbox\" id=\"fr-link-target-".concat(editor.id, "\" tabIndex=\"").concat(++tab_idx, "\"><span>").concat(checkmark, "</span></span><label id=\"fr-label-target-").concat(editor.id, "\">").concat(editor.language.translate('Open in new tab'), "</label></div>");
      }

      input_layer += '<div class="fr-action-buttons"><button class="fr-command fr-submit" role="button" data-cmd="linkInsert" href="#" tabIndex="' + ++tab_idx + '" type="button">' + editor.language.translate('Insert') + '</button></div></div>';
      var template = {
        buttons: link_buttons,
        input_layer: input_layer // Set the template in the popup.

      };
      var $popup = editor.popups.create('link.insert', template);

      if (editor.$wp) {
        editor.events.$on(editor.$wp, 'scroll.link-insert', function () {
          var $current_image = editor.image ? editor.image.get() : null;

          if ($current_image && editor.popups.isVisible('link.insert')) {
            imageLink();
          }

          if (get && editor.popups.isVisible('link.insert')) {
            update();
          }
        });
      }

      return $popup;
    }

    function remove() {
      var link = get();
      var $current_image = editor.image ? editor.image.get() : null;
      if (editor.events.trigger('link.beforeRemove', [link]) === false) return false;

      if ($current_image && link) {
        $current_image.unwrap();
        editor.image.edit($current_image);
      } else if (link) {
        editor.selection.save();
        $(link).replaceWith($(link).html());
        editor.selection.restore();

        _hideEditPopup();
      }
    }

    function _init() {
      // Edit on keyup.
      editor.events.on('keyup', function (e) {
        if (e.which != FE.KEYCODE.ESC) {
          _edit(e);
        }
      });
      editor.events.on('window.mouseup', _edit); // Do not follow links when edit is disabled.

      editor.events.$on(editor.$el, 'click', 'a', function (e) {
        if (editor.edit.isDisabled()) {
          e.preventDefault();
        }
      });

      if (editor.helpers.isMobile()) {
        editor.events.$on(editor.$doc, 'selectionchange', _edit);
      }

      _initInsertPopup(true); // Init on link.


      if (editor.el.tagName == 'A') {
        editor.$el.addClass('fr-view');
      } // Hit ESC when focus is in link edit popup.


      editor.events.on('toolbar.esc', function () {
        if (editor.popups.isVisible('link.edit')) {
          editor.events.disableBlur();
          editor.events.focus();
          return false;
        }
      }, true);
    }

    function usePredefined(val) {
      var link = editor.opts.linkList[val];
      var $popup = editor.popups.get('link.insert');
      var text_inputs = $popup.find('input.fr-link-attr[type="text"]');
      var check_inputs = $popup.find('input.fr-link-attr[type="checkbox"]');
      var $input;
      var i; // Add rel attribute to the popup if it exists
      // https://github.com/froala-labs/froala-editor-js-2/issues/831

      if (link.rel) {
        $popup.rel = link.rel;
      }

      for (i = 0; i < text_inputs.length; i++) {
        $input = $(text_inputs[i]);

        if (link[$input.attr('name')]) {
          $input.val(link[$input.attr('name')]); // Mark the input box as non empty for transition

          $input.toggleClass('fr-not-empty', true);
        } else if ($input.attr('name') != 'text') {
          $input.val('');
        }
      }

      for (i = 0; i < check_inputs.length; i++) {
        $input = $(check_inputs[i]);
        $input.attr('checked', $input.data('checked') == link[$input.attr('name')]);
      }

      editor.accessibility.focusPopup($popup);
    }

    function insertCallback() {
      var $popup = editor.popups.get('link.insert');
      var text_inputs = $popup.find('input.fr-link-attr[type="text"]');
      var check_inputs = $popup.find('input.fr-link-attr[type="checkbox"]');
      var href = (text_inputs.filter('[name="href"]').val() || '').trim();
      var text = text_inputs.filter('[name="text"]').val();
      var attrs = {};
      var $input;
      var i;

      for (i = 0; i < text_inputs.length; i++) {
        $input = $(text_inputs[i]);

        if (['href', 'text'].indexOf($input.attr('name')) < 0) {
          attrs[$input.attr('name')] = $input.val();
        }
      }

      for (i = 0; i < check_inputs.length; i++) {
        $input = $(check_inputs[i]);

        if ($input.is(':checked')) {
          attrs[$input.attr('name')] = $input.data('checked');
        } else {
          attrs[$input.attr('name')] = $input.data('unchecked') || null;
        }
      } // check for rel attritube here


      $popup.rel ? attrs.rel = $popup.rel : '';
      var t = editor.helpers.scrollTop();
      insert(href, text, attrs);
      $(editor.o_win).scrollTop(t);
    }

    function _split() {
      if (!editor.selection.isCollapsed()) {
        editor.selection.save();
        var markers = editor.$el.find('.fr-marker').addClass('fr-unprocessed').toArray();

        while (markers.length) {
          var $marker = $(markers.pop());
          $marker.removeClass('fr-unprocessed'); // Get deepest parent.

          var deep_parent = editor.node.deepestParent($marker.get(0));

          if (deep_parent) {
            var node = $marker.get(0);
            var close_str = '';
            var open_str = '';

            do {
              node = node.parentNode;

              if (!editor.node.isBlock(node)) {
                close_str = close_str + editor.node.closeTagString(node);
                open_str = editor.node.openTagString(node) + open_str;
              }
            } while (node != deep_parent);

            var marker_str = editor.node.openTagString($marker.get(0)) + $marker.html() + editor.node.closeTagString($marker.get(0));
            $marker.replaceWith('<span id="fr-break"></span>');
            var h = deep_parent.outerHTML; //  https://github.com/froala/wysiwyg-editor/issues/3048

            h = h.replace(/<span id="fr-break"><\/span>/g, close_str + marker_str + open_str);
            h = h.replace(open_str + close_str, '');
            deep_parent.outerHTML = h;
          }

          markers = editor.$el.find('.fr-marker.fr-unprocessed').toArray();
        }

        editor.html.cleanEmptyTags();
        editor.selection.restore();
      }
    }
    /**
     * Insert link into the editor.
     */


    function insert(href, text, attrs) {
      if (typeof attrs == 'undefined') attrs = {};
      if (editor.events.trigger('link.beforeInsert', [href, text, attrs]) === false) return false; // Get image if we have one selected.

      var $current_image = editor.image ? editor.image.get() : null;

      if (!$current_image && editor.el.tagName != 'A') {
        editor.selection.restore();
        editor.popups.hide('link.insert');
      } else if (editor.el.tagName == 'A') {
        editor.$el.focus();
      }

      var original_href = href; // Convert email address.

      if (editor.opts.linkConvertEmailAddress) {
        if (editor.helpers.isEmail(href) && !/^mailto:.*/i.test(href)) {
          href = 'mailto:' + href;
        }
      } // Check if is local path.


      var local_path = /^([A-Za-z]:(\\){1,2}|[A-Za-z]:((\\){1,2}[^\\]+)+)(\\)?$/i; // Add autoprefix.

      if (editor.opts.linkAutoPrefix !== '' && !new RegExp('^(' + FE.LinkProtocols.join('|') + '):.', 'i').test(href) && !/^data:image.*/i.test(href) && !/^(https?:|ftps?:|file:|)\/\//i.test(href) && !local_path.test(href)) {
        // Do prefix only if starting character is not absolute.
        if (['/', '{', '[', '#', '(', '.'].indexOf((href || '')[0]) < 0) {
          href = editor.opts.linkAutoPrefix + editor.helpers.sanitizeURL(href);
        }
      } // Sanitize the URL.


      href = editor.helpers.sanitizeURL(href); // Default attributs.

      if (editor.opts.linkAlwaysBlank) attrs.target = '_blank';
      if (editor.opts.linkAlwaysNoFollow) attrs.rel = 'nofollow';

      if (editor.helpers.isEmail(original_href)) {
        attrs.target = null;
        attrs.rel = null;
      } // https://github.com/froala/wysiwyg-editor/issues/1576.


      if (attrs.target == '_blank') {
        if (editor.opts.linkNoOpener) {
          if (!attrs.rel) attrs.rel = 'noopener';else attrs.rel += ' noopener';
        }

        if (editor.opts.linkNoReferrer) {
          if (!attrs.rel) attrs.rel = 'noreferrer';else attrs.rel += ' noreferrer';
        }
      } else if (attrs.target == null) {
        if (attrs.rel) {
          attrs.rel = attrs.rel.replace(/noopener/, '').replace(/noreferrer/, '');
        } else {
          attrs.rel = null;
        }
      } // Format text.


      text = text || '';

      if (href === editor.opts.linkAutoPrefix) {
        var $popup = editor.popups.get('link.insert');
        $popup.find('input[name="href"]').addClass('fr-error');
        editor.events.trigger('link.bad', [original_href]);
        return false;
      } // Check if we have selection only in one link.


      var link = get();
      var $link;

      if (link) {
        $link = $(link);
        $link.attr('href', href); // Change text if it is different.

        if (text.length > 0 && $link.text() != text && !$current_image) {
          var child = $link.get(0);

          while (child.childNodes.length === 1 && child.childNodes[0].nodeType == Node.ELEMENT_NODE) {
            child = child.childNodes[0];
          }

          $(child).text(text);
        }

        if (!$current_image) {
          $link.prepend(FE.START_MARKER).append(FE.END_MARKER);
        } // Set attributes.


        $link.attr(attrs);

        if (!$current_image) {
          editor.selection.restore();
        }
      } else {
        // We don't have any image selected.
        if (!$current_image) {
          // Remove current links.
          editor.format.remove('a'); // Nothing is selected.

          if (editor.selection.isCollapsed()) {
            text = text.length === 0 ? original_href : text;
            editor.html.insert('<a href="' + href + '">' + FE.START_MARKER + text.replace(/&/g, '&amp;').replace(/</, '&lt;', '>', '&gt;') + FE.END_MARKER + '</a>');
            editor.selection.restore();
          } else {
            if (text.length > 0 && text != editor.selection.text().replace(/\n/g, '')) {
              editor.selection.remove();
              editor.html.insert('<a href="' + href + '">' + FE.START_MARKER + text.replace(/&/g, '&amp;') + FE.END_MARKER + '</a>');
              editor.selection.restore();
            } else {
              _split(); // Add link.


              editor.format.apply('a', {
                href: href
              });
            }
          }
        } else {
          // Just wrap current image with a link.
          $current_image.wrap('<a href="' + href + '"></a>');

          if (editor.image.hasCaption()) {
            $current_image.parent().append($current_image.parents('.fr-img-caption').find('.fr-inner'));
          }
        } // Set attributes.


        var links = allSelected();

        for (var i = 0; i < links.length; i++) {
          $link = $(links[i]);
          $link.attr(attrs);
          $link.removeAttr('_moz_dirty');
        } // Show link edit if only one link.


        if (links.length == 1 && editor.$wp && !$current_image) {
          $(links[0]).prepend(FE.START_MARKER).append(FE.END_MARKER);
          editor.selection.restore();
        }
      } // Hide popup and try to edit.


      if (!$current_image) {
        _edit();
      } else {
        var $pop = editor.popups.get('link.insert');

        if ($pop) {
          $pop.find('input:focus').blur();
        }

        editor.image.edit($current_image);
      }
    }

    function update() {
      _hideEditPopup();

      var link = get();

      if (link) {
        var $popup = editor.popups.get('link.insert');
        if (!$popup) $popup = _initInsertPopup();

        if (!editor.popups.isVisible('link.insert')) {
          editor.popups.refresh('link.insert');
          editor.selection.save();

          if (editor.helpers.isMobile()) {
            editor.events.disableBlur();
            editor.$el.blur();
            editor.events.enableBlur();
          }
        }

        editor.popups.setContainer('link.insert', editor.$sc);
        var $ref = (editor.image ? editor.image.get() : null) || $(link);
        var left = $ref.offset().left + $ref.outerWidth() / 2;
        var top = $ref.offset().top + $ref.outerHeight();
        editor.popups.show('link.insert', left, top, $ref.outerHeight(), true);
      }
    }

    function back() {
      var $current_image = editor.image ? editor.image.get() : null;

      if (!$current_image) {
        editor.events.disableBlur();
        editor.selection.restore();
        editor.events.enableBlur();
        var link = get();

        if (link && editor.$wp) {
          editor.selection.restore();

          _hideEditPopup();

          _edit();
        } else if (editor.el.tagName == 'A') {
          editor.$el.focus();

          _edit();
        } else {
          editor.popups.hide('link.insert');
          editor.toolbar.showInline();
        }
      } else {
        editor.image.back();
      }
    }

    function imageLink() {
      var $el = editor.image ? editor.image.getEl() : null;

      if ($el) {
        var $popup = editor.popups.get('link.insert');

        if (editor.image.hasCaption()) {
          $el = $el.find('.fr-img-wrap');
        }

        if (!$popup) $popup = _initInsertPopup();

        _refreshInsertPopup(true);

        editor.popups.setContainer('link.insert', editor.$sc);
        var left = $el.offset().left + $el.outerWidth() / 2;
        var top = $el.offset().top + $el.outerHeight();
        editor.popups.show('link.insert', left, top, $el.outerHeight(), true);
      }
    }
    /**
     * Apply specific style.
     */


    function applyStyle(val, linkStyles, multipleStyles) {
      if (typeof multipleStyles == 'undefined') multipleStyles = editor.opts.linkMultipleStyles;
      if (typeof linkStyles == 'undefined') linkStyles = editor.opts.linkStyles;
      var link = get();
      if (!link) return false; // Remove multiple styles.

      if (!multipleStyles) {
        var styles = Object.keys(linkStyles);
        styles.splice(styles.indexOf(val), 1);
        $(link).removeClass(styles.join(' '));
      }

      $(link).toggleClass(val);

      _edit();
    }

    return {
      _init: _init,
      remove: remove,
      showInsertPopup: _showInsertPopup,
      usePredefined: usePredefined,
      insertCallback: insertCallback,
      insert: insert,
      update: update,
      get: get,
      allSelected: allSelected,
      back: back,
      imageLink: imageLink,
      applyStyle: applyStyle
    };
  }; // Register the link command.


  FE.DefineIcon('insertLink', {
    NAME: 'link',
    SVG_KEY: 'insertLink'
  });
  FE.RegisterShortcut(FE.KEYCODE.K, 'insertLink', null, 'K');
  FE.RegisterCommand('insertLink', {
    title: 'Insert Link',
    undo: false,
    focus: true,
    refreshOnCallback: false,
    popup: true,
    callback: function callback() {
      if (!this.popups.isVisible('link.insert')) {
        this.link.showInsertPopup();
      } else {
        if (this.$el.find('.fr-marker').length) {
          this.events.disableBlur();
          this.selection.restore();
        }

        this.popups.hide('link.insert');
      }
    },
    plugin: 'link'
  });
  FE.DefineIcon('linkOpen', {
    NAME: 'external-link',
    FA5NAME: 'external-link-alt',
    SVG_KEY: 'openLink'
  });
  FE.RegisterCommand('linkOpen', {
    title: 'Open Link',
    undo: false,
    refresh: function refresh($btn) {
      var link = this.link.get();

      if (link) {
        $btn.removeClass('fr-hidden');
      } else {
        $btn.addClass('fr-hidden');
      }
    },
    callback: function callback() {
      var link = this.link.get();

      if (link) {
        if (link.href.indexOf('mailto:') !== -1) {
          this.o_win.open(link.href).close();
        } else {
          this.o_win.open(link.href, '_blank', 'noopener');
        }

        this.popups.hide('link.edit');
      }
    },
    plugin: 'link'
  });
  FE.DefineIcon('linkEdit', {
    NAME: 'edit',
    SVG_KEY: 'editLink'
  });
  FE.RegisterCommand('linkEdit', {
    title: 'Edit Link',
    undo: false,
    refreshAfterCallback: false,
    popup: true,
    callback: function callback() {
      this.link.update();
    },
    refresh: function refresh($btn) {
      var link = this.link.get();

      if (link) {
        $btn.removeClass('fr-hidden');
      } else {
        $btn.addClass('fr-hidden');
      }
    },
    plugin: 'link'
  });
  FE.DefineIcon('linkRemove', {
    NAME: 'unlink',
    SVG_KEY: 'unlink'
  });
  FE.RegisterCommand('linkRemove', {
    title: 'Unlink',
    callback: function callback() {
      this.link.remove();
    },
    refresh: function refresh($btn) {
      var link = this.link.get();

      if (link) {
        $btn.removeClass('fr-hidden');
      } else {
        $btn.addClass('fr-hidden');
      }
    },
    plugin: 'link'
  });
  FE.DefineIcon('linkBack', {
    NAME: 'arrow-left',
    SVG_KEY: 'back'
  });
  FE.RegisterCommand('linkBack', {
    title: 'Back',
    undo: false,
    focus: false,
    back: true,
    refreshAfterCallback: false,
    callback: function callback() {
      this.link.back();
    },
    refresh: function refresh($btn) {
      var link = this.link.get() && this.doc.hasFocus();
      var $current_image = this.image ? this.image.get() : null;

      if (!$current_image && !link && !this.opts.toolbarInline) {
        $btn.addClass('fr-hidden');
        $btn.next('.fr-separator').addClass('fr-hidden');
      } else {
        $btn.removeClass('fr-hidden');
        $btn.next('.fr-separator').removeClass('fr-hidden');
      }
    },
    plugin: 'link'
  });
  FE.DefineIcon('linkList', {
    NAME: 'search',
    SVG_KEY: 'search'
  });
  FE.RegisterCommand('linkList', {
    title: 'Choose Link',
    type: 'dropdown',
    focus: false,
    undo: false,
    refreshAfterCallback: false,
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = this.opts.linkList;

      for (var i = 0; i < options.length; i++) {
        c += '<li role="presentation"><a class="fr-command" tabIndex="-1" role="option" data-cmd="linkList" data-param1="' + i + '">' + (options[i].displayText || options[i].text) + '</a></li>';
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      this.link.usePredefined(val);
    },
    plugin: 'link'
  });
  FE.RegisterCommand('linkInsert', {
    focus: false,
    refreshAfterCallback: false,
    callback: function callback() {
      this.link.insertCallback();
    },
    refresh: function refresh($btn) {
      var link = this.link.get();

      if (link) {
        $btn.text(this.language.translate('Update'));
      } else {
        $btn.text(this.language.translate('Insert'));
      }
    },
    plugin: 'link'
  }); // Image link.

  FE.DefineIcon('imageLink', {
    NAME: 'link',
    SVG_KEY: 'insertLink'
  });
  FE.RegisterCommand('imageLink', {
    title: 'Insert Link',
    undo: false,
    focus: false,
    popup: true,
    callback: function callback() {
      this.link.imageLink();
    },
    refresh: function refresh($btn) {
      var link = this.link.get();
      var $prev;

      if (link) {
        $prev = $btn.prev();

        if ($prev.hasClass('fr-separator')) {
          $prev.removeClass('fr-hidden');
        }

        $btn.addClass('fr-hidden');
      } else {
        $prev = $btn.prev();

        if ($prev.hasClass('fr-separator')) {
          $prev.addClass('fr-hidden');
        }

        $btn.removeClass('fr-hidden');
      }
    },
    plugin: 'link'
  }); // Link styles.

  FE.DefineIcon('linkStyle', {
    NAME: 'magic',
    SVG_KEY: 'linkStyles'
  });
  FE.RegisterCommand('linkStyle', {
    title: 'Style',
    type: 'dropdown',
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = this.opts.linkStyles;

      for (var cls in options) {
        if (options.hasOwnProperty(cls)) {
          c += '<li role="presentation"><a class="fr-command" tabIndex="-1" role="option" data-cmd="linkStyle" data-param1="' + cls + '">' + this.language.translate(options[cls]) + '</a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      this.link.applyStyle(val);
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      var $ = this.$;
      var link = this.link.get();

      if (link) {
        var $link = $(link);
        $dropdown.find('.fr-command').each(function () {
          var cls = $(this).data('param1');
          var active = $link.hasClass(cls);
          $(this).toggleClass('fr-active', active).attr('aria-selected', active);
        });
      }
    },
    refresh: function refresh($btn) {
      var link = this.link.get();

      if (link) {
        $btn.removeClass('fr-hidden');
      } else {
        $btn.addClass('fr-hidden');
      }
    },
    plugin: 'link'
  });

  Object.assign(FE.DEFAULTS, {
    listAdvancedTypes: true
  });

  FE.PLUGINS.lists = function (editor) {
    var $ = editor.$;

    function _openFlag(tag_name) {
      return '<span class="fr-open-' + tag_name.toLowerCase() + '"></span>';
    }

    function _closeFlag(tag_name) {
      return '<span class="fr-close-' + tag_name.toLowerCase() + '"></span>';
    }
    /**
     * Replace list type.
     */


    function _replace(blocks, tag_name) {
      var lists = [];

      for (var i = 0; i < blocks.length; i++) {
        var parent_node = blocks[i].parentNode;

        if (blocks[i].tagName == 'LI' && parent_node.tagName != tag_name && lists.indexOf(parent_node) < 0) {
          lists.push(parent_node);
        }
      }

      for (var _i = lists.length - 1; _i >= 0; _i--) {
        var $l = $(lists[_i]);
        $l.replaceWith('<' + tag_name.toLowerCase() + ' ' + editor.node.attributes($l.get(0)) + '>' + $l.html() + '</' + tag_name.toLowerCase() + '>');
      }
    }
    /**
     * Format blocks.
     */


    function _format(blocks, tag_name) {
      _replace(blocks, tag_name); // Format those blocks that are not LI.


      var default_tag = editor.html.defaultTag();
      var start_margin = null;
      var prop;
      if (blocks.length) prop = editor.opts.direction == 'rtl' || $(blocks[0]).css('direction') == 'rtl' ? 'margin-right' : 'margin-left';

      for (var i = 0; i < blocks.length; i++) {
        // Ignore table tags.
        if (blocks[i].tagName == 'TD' || blocks[i].tagName == 'TH') {
          continue;
        }

        if (blocks[i].tagName != 'LI') {
          // Get margin left and unset it.
          var margin_left = editor.helpers.getPX($(blocks[i]).css(prop)) || 0;
          blocks[i].style.marginLeft = null; // Start indentation relative to the first element.

          if (start_margin === null) start_margin = margin_left; // Update open tag.

          var open_tag = start_margin > 0 ? '<' + tag_name + ' style="' + prop + ': ' + start_margin + 'px "' + '>' : '<' + tag_name + '>';
          var end_tag = '</' + tag_name + '>'; // Subsctract starting.

          margin_left = margin_left - start_margin; // Keep wrapping.

          while (margin_left / editor.opts.indentMargin > 0) {
            open_tag += '<' + tag_name + '>';
            end_tag += end_tag;
            margin_left = margin_left - editor.opts.indentMargin;
          } // Default tag.


          if (default_tag && blocks[i].tagName.toLowerCase() == default_tag) {
            $(blocks[i]).replaceWith(open_tag + '<li' + editor.node.attributes(blocks[i]) + '>' + $(blocks[i]).html() + '</li>' + end_tag);
          } else {
            $(blocks[i]).wrap(open_tag + '<li></li>' + end_tag);
          }
        }
      }

      editor.clean.lists();
    }
    /**
     * Unformat.
     */


    function _unformat(blocks) {
      var i;
      var j; // If there are LI that have parents selected, then remove them.

      for (i = blocks.length - 1; i >= 0; i--) {
        for (j = i - 1; j >= 0; j--) {
          if ($(blocks[j]).find(blocks[i]).length || blocks[j] == blocks[i]) {
            blocks.splice(i, 1);
            break;
          }
        }
      } // Unwrap remaining LI.


      var lists = [];

      for (i = 0; i < blocks.length; i++) {
        var $li = $(blocks[i]);
        var parent_node = blocks[i].parentNode;
        var li_class = $li.attr('class');
        $li.before(_closeFlag(parent_node.tagName)); // Nested case.

        if (parent_node.parentNode.tagName == 'LI') {
          $li.before(_closeFlag('LI'));
          $li.after(_openFlag('LI'));
        } else {
          var li_attrs = ''; // https://github.com/froala/wysiwyg-editor/issues/1765 .

          if (li_class) {
            li_attrs += ' class="' + li_class + '"';
          }

          var prop = editor.opts.direction == 'rtl' || $li.css('direction') == 'rtl' ? 'margin-right' : 'margin-left';

          if (editor.helpers.getPX($(parent_node).css(prop)) && ($(parent_node).attr('style') || '').indexOf(prop + ':') >= 0) {
            li_attrs += ' style="' + prop + ':' + editor.helpers.getPX($(parent_node).css(prop)) + 'px;"';
          } // When we have a default tag.


          if (editor.html.defaultTag()) {
            // If there are no inner block tags, put everything in a default tag.
            if ($li.find(editor.html.blockTagsQuery()).length === 0) {
              $li.wrapInner(editor.html.defaultTag() + li_attrs);
            }
          } // Append BR if the node is not empty.


          if (!editor.node.isEmpty($li.get(0), true) && $li.find(editor.html.blockTagsQuery()).length === 0) {
            $li.append('<br>');
          }

          $li.append(_openFlag('LI'));
          $li.prepend(_closeFlag('LI'));
        }

        $li.after(_openFlag(parent_node.tagName)); // Nested case. We should look for an upper parent.

        if (parent_node.parentNode.tagName == 'LI') {
          parent_node = parent_node.parentNode.parentNode;
        }

        if (lists.indexOf(parent_node) < 0) {
          lists.push(parent_node);
        }
      } // Replace the open and close tags.


      for (i = 0; i < lists.length; i++) {
        var $l = $(lists[i]);
        var html = $l.html();
        html = html.replace(/<span class="fr-close-([a-z]*)"><\/span>/g, '</$1>');
        html = html.replace(/<span class="fr-open-([a-z]*)"><\/span>/g, '<$1>');
        $l.replaceWith(editor.node.openTagString($l.get(0)) + html + editor.node.closeTagString($l.get(0)));
      } // Clean empty lists.


      editor.$el.find('li:empty').remove();
      editor.$el.find('ul:empty, ol:empty').remove();
      editor.clean.lists();
      editor.html.wrap();
    }
    /**
     * Check if should unformat lists.
     */


    function _shouldUnformat(blocks, tag_name) {
      var do_unformat = true;

      for (var i = 0; i < blocks.length; i++) {
        // Something else than LI is selected.
        if (blocks[i].tagName != 'LI') {
          return false;
        } // There is a different kind of list selected. Replace is the appropiate action.


        if (blocks[i].parentNode.tagName != tag_name) {
          do_unformat = false;
        }
      }

      return do_unformat;
    }
    /**
     * Call the list actions.
     */


    function format(tag_name, list_type) {
      var i;
      var blocks; // Wrap.

      editor.selection.save();
      editor.html.wrap(true, true, true, true);
      editor.selection.restore();
      blocks = editor.selection.blocks(); // Normalize nodes by keeping the LI.
      // <li><h1>foo<h1></li> will return h1.

      for (i = 0; i < blocks.length; i++) {
        if (blocks[i].tagName != 'LI' && blocks[i].parentNode.tagName == 'LI') {
          blocks[i] = blocks[i].parentNode;
        }
      } // Save selection so that we can play at wish.


      editor.selection.save(); // Decide if to format or unformat list.

      if (_shouldUnformat(blocks, tag_name)) {
        if (!list_type) {
          _unformat(blocks);
        }
      } else {
        _format(blocks, tag_name, list_type);
      } // Unwrap.


      editor.html.unwrap(); // Restore the selection.

      editor.selection.restore();
      list_type = list_type || 'default';

      if (list_type) {
        blocks = editor.selection.blocks();

        for (i = 0; i < blocks.length; i++) {
          if (blocks[i].tagName != 'LI' && blocks[i].parentNode.tagName == 'LI') {
            blocks[i] = blocks[i].parentNode;
          }
        }

        for (i = 0; i < blocks.length; i++) {
          // Something else than LI is selected.
          if (blocks[i].tagName != 'LI') {
            continue;
          } // There is a different kind of list selected. Replace is the appropiate action.


          $(blocks[i].parentNode).css('list-style-type', list_type === 'default' ? '' : list_type);

          if (($(blocks[i].parentNode).attr('style') || '').length === 0) {
            $(blocks[i].parentNode).removeAttr('style');
          }
        }
      }
    }
    /**
     * Refresh list buttons.
     */


    function refresh($btn, tag_name) {
      var $el = $(editor.selection.element());

      if ($el.get(0) != editor.el) {
        var li = $el.get(0);

        if (li.tagName != 'LI' && li.firstElementChild && li.firstElementChild.tagName != 'LI') {
          li = $el.parents('li').get(0);
        } else if (li.tagName != 'LI' && !li.firstElementChild) {
          li = $el.parents('li').get(0);
        } else if (li.firstElementChild && li.firstElementChild.tagName == 'LI') {
          li = $el.get(0).firstChild;
        } else {
          li = $el.get(0);
        }

        if (li && li.parentNode.tagName == tag_name && editor.el.contains(li.parentNode)) {
          $btn.addClass('fr-active');
        }
      }
    }
    /**
     * Indent selected list items.
     */


    function _indent(blocks) {
      editor.selection.save();

      for (var i = 0; i < blocks.length; i++) {
        // There should be a previous li.
        var prev_li = blocks[i].previousSibling;

        if (prev_li) {
          var nl = $(blocks[i]).find('> ul, > ol').last().get(0); // Current LI has a nested list.

          if (nl) {
            // Build a new list item and prepend it to the list.
            var $li = $(document.createElement('li'));
            $(nl).prepend($li); // Get first node of the list item.

            var node = editor.node.contents(blocks[i])[0]; // While node and it is not a list, append to the new list item.

            while (node && !editor.node.isList(node)) {
              var tmp = node.nextSibling;
              $li.append(node);
              node = tmp;
            } // Append current list to the previous node.


            $(prev_li).append($(nl));
            $(blocks[i]).remove();
          } else {
            var prev_nl = $(prev_li).find('> ul, > ol').last().get(0);

            if (prev_nl) {
              $(prev_nl).append($(blocks[i]));
            } else {
              var $new_nl = $('<' + blocks[i].parentNode.tagName + '>');
              $(prev_li).append($new_nl);
              $new_nl.append($(blocks[i]));
            }
          }
        }
      }

      editor.clean.lists();
      editor.selection.restore();
    }
    /**
     * Outdent selected list items.
     */


    function _outdent(blocks) {
      editor.selection.save();

      _unformat(blocks);

      editor.selection.restore();
    }
    /**
     * Hook into the indent/outdent events.
     */


    function _afterCommand(cmd) {
      if (cmd == 'indent' || cmd == 'outdent') {
        var do_indent = false;
        var blocks = editor.selection.blocks();
        var blks = [];
        var parentBlk = blocks[0].previousSibling || blocks[0].parentElement;

        if (cmd == 'outdent') {
          if (parentBlk.tagName == 'LI' || parentBlk.parentNode.tagName != 'LI') {
            return;
          }
        } else {
          if (!blocks[0].previousSibling || blocks[0].previousSibling.tagName != 'LI') {
            return;
          }
        }

        for (var i = 0; i < blocks.length; i++) {
          if (blocks[i].tagName == 'LI') {
            do_indent = true;
            blks.push(blocks[i]);
          } else if (blocks[i].parentNode.tagName == 'LI') {
            do_indent = true;
            blks.push(blocks[i].parentNode);
          }
        }

        if (do_indent) {
          if (cmd == 'indent') _indent(blks);else _outdent(blks);
        }
      }
    }
    /**
     * Init.
     */


    function _init() {
      editor.events.on('commands.after', _afterCommand); // TAB key in lists.

      editor.events.on('keydown', function (e) {
        if (e.which == FE.KEYCODE.TAB) {
          var blocks = editor.selection.blocks();
          var blks = [];

          for (var i = 0; i < blocks.length; i++) {
            if (blocks[i].tagName == 'LI') {
              blks.push(blocks[i]);
            } else if (blocks[i].parentNode.tagName == 'LI') {
              blks.push(blocks[i].parentNode);
            }
          } // There is more than one list item selected.
          // Selection is at the beginning of the selected list item.


          if (blks.length > 1 || blks.length && (editor.selection.info(blks[0]).atStart || editor.node.isEmpty(blks[0]))) {
            e.preventDefault();
            e.stopPropagation();
            if (!e.shiftKey) _indent(blks);else _outdent(blks);
            return false;
          }
        }
      }, true);
    }

    return {
      _init: _init,
      format: format,
      refresh: refresh
    };
  }; // Register the font size command.


  FE.DefineIcon('formatOLSimple', {
    NAME: 'list-ol',
    SVG_KEY: 'orderedList'
  });
  FE.RegisterCommand('formatOLSimple', {
    title: 'Ordered List',
    type: 'button',
    options: {
      'default': 'Default',
      circle: 'Circle',
      disc: 'Disc',
      square: 'Square'
    },
    refresh: function refresh($btn) {
      this.lists.refresh($btn, 'OL');
    },
    callback: function callback(cmd, param) {
      this.lists.format('OL', param);
    },
    plugin: 'lists'
  }); // Register the font size command.

  FE.RegisterCommand('formatUL', {
    title: 'Unordered List',
    type: 'button',
    hasOptions: function hasOptions() {
      return this.opts.listAdvancedTypes;
    },
    options: {
      'default': 'Default',
      circle: 'Circle',
      disc: 'Disc',
      square: 'Square'
    },
    refresh: function refresh($btn) {
      this.lists.refresh($btn, 'UL');
    },
    callback: function callback(cmd, param) {
      this.lists.format('UL', param);
    },
    plugin: 'lists'
  }); // Register the font size command.

  FE.RegisterCommand('formatOL', {
    title: 'Ordered List',
    hasOptions: function hasOptions() {
      return this.opts.listAdvancedTypes;
    },
    options: {
      'default': 'Default',
      'lower-alpha': 'Lower Alpha',
      'lower-greek': 'Lower Greek',
      'lower-roman': 'Lower Roman',
      'upper-alpha': 'Upper Alpha',
      'upper-roman': 'Upper Roman'
    },
    refresh: function refresh($btn) {
      this.lists.refresh($btn, 'OL');
    },
    callback: function callback(cmd, param) {
      this.lists.format('OL', param);
    },
    plugin: 'lists'
  }); // Add the list icons.

  FE.DefineIcon('formatUL', {
    NAME: 'list-ul',
    SVG_KEY: 'unorderedList'
  });
  FE.DefineIcon('formatOL', {
    NAME: 'list-ol',
    SVG_KEY: 'orderedList'
  });

  Object.assign(FE.DEFAULTS, {
    paragraphFormat: {
      N: 'Normal',
      H1: 'Heading 1',
      H2: 'Heading 2',
      H3: 'Heading 3',
      H4: 'Heading 4',
      PRE: 'Code'
    },
    paragraphFormatSelection: false,
    paragraphDefaultSelection: 'Paragraph Format'
  });

  FE.PLUGINS.paragraphFormat = function (editor) {
    var $ = editor.$;
    /**
     * Style content inside LI when LI is selected.
     * This case happens only when the LI contains a nested list or when it has no block tag inside.
     */

    function _styleLiWithoutBlocks($li, val) {
      var defaultTag = editor.html.defaultTag(); // If val is null or default tag already do nothing.

      if (val && val.toLowerCase() != defaultTag) {
        // Deal with nested lists.
        if ($li.find('ul, ol').length > 0) {
          var $el = $('<' + val + '>');
          $li.prepend($el);
          var node = editor.node.contents($li.get(0))[0];

          while (node && ['UL', 'OL'].indexOf(node.tagName) < 0) {
            var next_node = node.nextSibling;
            $el.append(node);
            node = next_node;
          }
        } // Wrap list content.
        else {
            $li.html('<' + val + '>' + $li.html() + '</' + val + '>');
          }
      }
    }
    /**
     * Style content inside LI.
     */


    function _styleLiWithBlocks($blk, val) {
      var defaultTag = editor.html.defaultTag(); // Prepare a temp div.

      if (!val || val.toLowerCase() == defaultTag) val = 'div class="fr-temp-div"';
      $blk.replaceWith($('<' + val + '>').html($blk.html()));
    }
    /**
     * Style content inside TD.
     */


    function _styleTdWithBlocks($blk, val) {
      var defaultTag = editor.html.defaultTag(); // Prepare a temp div.

      if (!val) val = 'div class="fr-temp-div"' + (editor.node.isEmpty($blk.get(0), true) ? ' data-empty="true"' : ''); // Return to the regular case. We don't use P inside TD/TH.

      if (val.toLowerCase() == defaultTag) {
        // If node is not empty, then add a BR.
        if (!editor.node.isEmpty($blk.get(0), true)) {
          $blk.append('<br/>');
        }

        $blk.replaceWith($blk.html());
      } // Replace with the new tag.
      else {
          $blk.replaceWith($('<' + val + '>').html($blk.html()));
        }
    }
    /**
     * Basic style.
     */


    function _style($blk, val) {
      if (!val) val = 'div class="fr-temp-div"' + (editor.node.isEmpty($blk.get(0), true) ? ' data-empty="true"' : '');
      $blk.replaceWith($('<' + val + ' ' + editor.node.attributes($blk.get(0)) + '>').html($blk.html()).removeAttr('data-empty'));
    }
    /**
     * Apply style.
     */


    function apply(val) {
      // Normal.
      if (val == 'N') val = editor.html.defaultTag(); // Wrap.

      editor.selection.save();
      editor.html.wrap(true, true, !editor.opts.paragraphFormat.BLOCKQUOTE, true, true);
      editor.selection.restore(); // Get blocks.

      var blocks = editor.selection.blocks(); // Save selection to restore it later.

      editor.selection.save();
      editor.$el.find('pre').attr('skip', true); // Go through each block and apply style to it.

      for (var i = 0; i < blocks.length; i++) {
        if (blocks[i].tagName != val && !editor.node.isList(blocks[i])) {
          var $blk = $(blocks[i]); // Style the content inside LI when there is selection right in LI.

          if (blocks[i].tagName == 'LI') {
            _styleLiWithoutBlocks($blk, val);
          } // Style the content inside LI when we have other tag in LI.
          else if (blocks[i].parentNode.tagName == 'LI' && blocks[i]) {
              _styleLiWithBlocks($blk, val);
            } // Style the content inside TD/TH.
            else if (['TD', 'TH'].indexOf(blocks[i].parentNode.tagName) >= 0) {
                _styleTdWithBlocks($blk, val);
              } // Regular case.
              else {
                  _style($blk, val);
                }
        }
      } // Join PRE together.


      editor.$el.find('pre:not([skip="true"]) + pre:not([skip="true"])').each(function () {
        $(this).prev().append('<br>' + $(this).html());
        $(this).remove();
      });
      editor.$el.find('pre').removeAttr('skip'); // Unwrap temp divs.

      editor.html.unwrap(); // Restore selection.

      editor.selection.restore();
    }

    function refreshOnShow($btn, $dropdown) {
      var blocks = editor.selection.blocks();

      if (blocks.length) {
        var blk = blocks[0];
        var tag = 'N';
        var default_tag = editor.html.defaultTag();

        if (blk.tagName.toLowerCase() != default_tag && blk != editor.el) {
          tag = blk.tagName;
        }

        $dropdown.find('.fr-command[data-param1="' + tag + '"]').addClass('fr-active').attr('aria-selected', true);
      } else {
        $dropdown.find('.fr-command[data-param1="N"]').addClass('fr-active').attr('aria-selected', true);
      }
    }

    function refresh($btn) {
      if (editor.opts.paragraphFormatSelection) {
        var blocks = editor.selection.blocks();

        if (blocks.length) {
          var blk = blocks[0];
          var tag = 'N';
          var default_tag = editor.html.defaultTag();

          if (blk.tagName.toLowerCase() != default_tag && blk != editor.el) {
            tag = blk.tagName;
          }

          if (['LI', 'TD', 'TH'].indexOf(tag) >= 0) {
            tag = 'N';
          }

          $btn.find('>span').text(editor.language.translate(editor.opts.paragraphFormat[tag]));
        } else {
          $btn.find('>span').text(editor.language.translate(editor.opts.paragraphFormat.N));
        }
      }
    }

    return {
      apply: apply,
      refreshOnShow: refreshOnShow,
      refresh: refresh
    };
  }; // Register the font size command.


  FE.RegisterCommand('paragraphFormat', {
    type: 'dropdown',
    displaySelection: function displaySelection(editor) {
      return editor.opts.paragraphFormatSelection;
    },
    defaultSelection: function defaultSelection(editor) {
      return editor.language.translate(editor.opts.paragraphDefaultSelection);
    },
    displaySelectionWidth: 80,
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = this.opts.paragraphFormat;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          var shortcut = this.shortcuts.get('paragraphFormat.' + val);

          if (shortcut) {
            shortcut = '<span class="fr-shortcut">' + shortcut + '</span>';
          } else {
            shortcut = '';
          }

          c += '<li role="presentation"><' + (val == 'N' ? this.html.defaultTag() || 'DIV' : val) + ' style="padding: 0 !important; margin: 0 !important;" role="presentation"><a class="fr-command" tabIndex="-1" role="option" data-cmd="paragraphFormat" data-param1="' + val + '" title="' + this.language.translate(options[val]) + '">' + this.language.translate(options[val]) + '</a></' + (val == 'N' ? this.html.defaultTag() || 'DIV' : val) + '></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    title: 'Paragraph Format',
    callback: function callback(cmd, val) {
      this.paragraphFormat.apply(val);
    },
    refresh: function refresh($btn) {
      this.paragraphFormat.refresh($btn);
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      this.paragraphFormat.refreshOnShow($btn, $dropdown);
    },
    plugin: 'paragraphFormat'
  }); // Add the font size icon.

  FE.DefineIcon('paragraphFormat', {
    NAME: 'paragraph',
    SVG_KEY: 'paragraphFormat'
  });

  Object.assign(FE.DEFAULTS, {
    paragraphStyles: {
      'fr-text-gray': 'Gray',
      'fr-text-bordered': 'Bordered',
      'fr-text-spaced': 'Spaced',
      'fr-text-uppercase': 'Uppercase'
    },
    paragraphMultipleStyles: true
  });

  FE.PLUGINS.paragraphStyle = function (editor) {
    var $ = editor.$;
    /**
     * Apply style.
     */

    function apply(val, paragraphStyles, paragraphMultipleStyles) {
      if (typeof paragraphStyles === 'undefined') paragraphStyles = editor.opts.paragraphStyles;
      if (typeof paragraphMultipleStyles === 'undefined') paragraphMultipleStyles = editor.opts.paragraphMultipleStyles;
      var styles = ''; // Remove multiple styles.

      if (!paragraphMultipleStyles) {
        styles = Object.keys(paragraphStyles);
        styles.splice(styles.indexOf(val), 1);
        styles = styles.join(' ');
      }

      editor.selection.save();
      editor.html.wrap(true, true, true, true);
      editor.selection.restore();
      var blocks = editor.selection.blocks(); // Save selection to restore it later.

      editor.selection.save();
      var hasClass = $(blocks[0]).hasClass(val);

      for (var i = 0; i < blocks.length; i++) {
        $(blocks[i]).removeClass(styles).toggleClass(val, !hasClass);
        if ($(blocks[i]).hasClass('fr-temp-div')) $(blocks[i]).removeClass('fr-temp-div');
        if ($(blocks[i]).attr('class') === '') $(blocks[i]).removeAttr('class');
      } // Unwrap temp divs.


      editor.html.unwrap(); // Restore selection.

      editor.selection.restore();
    }

    function refreshOnShow($btn, $dropdown) {
      var blocks = editor.selection.blocks();

      if (blocks.length) {
        var $blk = $(blocks[0]);
        $dropdown.find('.fr-command').each(function () {
          var cls = $(this).data('param1');
          var active = $blk.hasClass(cls);
          $(this).toggleClass('fr-active', active).attr('aria-selected', active);
        });
      }
    }

    function _init() {}

    return {
      _init: _init,
      apply: apply,
      refreshOnShow: refreshOnShow
    };
  }; // Register the font size command.


  FE.RegisterCommand('paragraphStyle', {
    type: 'dropdown',
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = this.opts.paragraphStyles;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          c += '<li role="presentation"><a class="fr-command ' + val + '" tabIndex="-1" role="option" data-cmd="paragraphStyle" data-param1="' + val + '" title="' + this.language.translate(options[val]) + '">' + this.language.translate(options[val]) + '</a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    title: 'Paragraph Style',
    callback: function callback(cmd, val) {
      this.paragraphStyle.apply(val);
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      this.paragraphStyle.refreshOnShow($btn, $dropdown);
    },
    plugin: 'paragraphStyle'
  }); // Add the font size icon.

  FE.DefineIcon('paragraphStyle', {
    NAME: 'magic',
    SVG_KEY: 'paragraphStyle'
  });

  Object.assign(FE.DEFAULTS, {
    html2pdf: window.html2pdf
  });

  FE.PLUGINS.print = function (editor) {
    function _prepare(callback) {
      // Get editor content for printing.
      var contents = editor.$el.html(); // Get or create the iframe for printing.

      var print_iframe = null;

      if (editor.shared.print_iframe) {
        print_iframe = editor.shared.print_iframe;
      } else {
        print_iframe = document.createElement('iframe');
        print_iframe.name = 'fr-print';
        print_iframe.style.position = 'fixed';
        print_iframe.style.top = '0';
        print_iframe.style.left = '-9999px';
        print_iframe.style.height = '100%';
        print_iframe.style.width = '0';
        print_iframe.style.overflow = 'hidden';
        print_iframe.style['z-index'] = '2147483647';
        print_iframe.style.tabIndex = '-1'; // Remove editor on shared destroy.

        editor.events.on('shared.destroy', function () {
          print_iframe.remove();
        });
        editor.shared.print_iframe = print_iframe;
      }

      try {
        document.body.removeChild(print_iframe);
      } catch (ex) {}

      document.body.appendChild(print_iframe); // Iframe ready.

      var listener = function listener() {
        callback();
        print_iframe.removeEventListener('load', listener);
      };

      print_iframe.addEventListener('load', listener); // Build printing document.

      var frame_doc = print_iframe.contentWindow;
      frame_doc.document.open();
      frame_doc.document.write('<!DOCTYPE html><html ' + (editor.opts.documentReady ? 'style="margin: 0; padding: 0;"' : '') + '><head><title>' + document.title + '</title>'); // Add styles.

      Array.prototype.forEach.call(document.querySelectorAll('style'), function (style_el) {
        style_el = style_el.cloneNode(true);
        frame_doc.document.write(style_el.outerHTML);
      }); // Add css links.

      var style_elements = document.querySelectorAll('link[rel=stylesheet]');
      Array.prototype.forEach.call(style_elements, function (link_el) {
        var new_link_el = document.createElement('link');
        new_link_el.rel = link_el.rel;
        new_link_el.href = link_el.href;
        new_link_el.media = 'print';
        new_link_el.type = 'text/css';
        new_link_el.media = 'all';
        frame_doc.document.write(new_link_el.outerHTML);
      });
      frame_doc.document.write('</head><body style="height:auto;text-align: ' + (editor.opts.direction == 'rtl' ? 'right' : 'left') + '; direction: ' + editor.opts.direction + '; ' + (editor.opts.documentReady ? ' padding: 2cm; width: 17cm; margin: 0;' : '') + '"><div class="fr-view">'); // Add editor contents.

      frame_doc.document.write(contents);
      frame_doc.document.write('</div></body></html>');
      frame_doc.document.close();
    }

    function run() {
      _prepare(function () {
        setTimeout(function () {
          // Focus iframe window.
          editor.events.disableBlur();
          window.frames['fr-print'].focus(); // Open printing window.

          window.frames['fr-print'].print(); // Refocus editor's window.

          editor.$win.get(0).focus(); // Focus editor.

          editor.events.disableBlur();
          editor.events.focus();
        }, 0);
      });
    }

    function toPDF() {
      if (editor.opts.html2pdf) {
        editor.$el.css('text-align', 'left');
        editor.opts.html2pdf().set({
          margin: [10, 20],
          html2canvas: {
            useCORS: true
          }
        }).from(editor.el).save();
        setTimeout(function () {
          editor.$el.css('text-align', '');
        }, 100);
      }
    }

    return {
      run: run,
      toPDF: toPDF
    };
  };

  FE.DefineIcon('print', {
    NAME: 'print',
    SVG_KEY: 'print'
  });
  FE.RegisterCommand('print', {
    title: 'Print',
    undo: false,
    focus: false,
    plugin: 'print',
    callback: function callback() {
      this.print.run();
    }
  });
  FE.DefineIcon('getPDF', {
    NAME: 'file-pdf-o',
    FA5NAME: 'file-pdf',
    SVG_KEY: 'pdfExport'
  });
  FE.RegisterCommand('getPDF', {
    title: 'Download PDF',
    type: 'button',
    focus: false,
    undo: false,
    callback: function callback() {
      this.print.toPDF();
    }
  });

  Object.assign(FE.DEFAULTS, {
    quickInsertButtons: ['image', 'video', 'embedly', 'table', 'ul', 'ol', 'hr'],
    quickInsertTags: ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'blockquote'],
    quickInsertEnabled: true
  });
  FE.QUICK_INSERT_BUTTONS = {};
  FE.DefineIcon('quickInsert', {
    SVG_KEY: 'add',
    template: 'svg'
  });

  FE.RegisterQuickInsertButton = function (name, data) {
    FE.QUICK_INSERT_BUTTONS[name] = Object.assign({
      undo: true
    }, data);
  };

  FE.RegisterQuickInsertButton('image', {
    icon: 'insertImage',
    requiredPlugin: 'image',
    title: 'Insert Image',
    undo: false,
    callback: function callback() {
      var editor = this;
      var $ = editor.$;

      if (!editor.shared.$qi_image_input) {
        editor.shared.$qi_image_input = $(document.createElement('input')).attr('accept', 'image/' + editor.opts.imageAllowedTypes.join(', image/').toLowerCase()).attr('name', 'quickInsertImage' + this.id).attr('style', 'display: none;').attr('type', 'file');
        $('body').first().append(editor.shared.$qi_image_input);
        editor.events.$on(editor.shared.$qi_image_input, 'change', function () {
          var inst = $(this).data('inst');

          if (this.files) {
            inst.quickInsert.hide();
            inst.image.upload(this.files);
          } // Chrome fix.


          $(this).val('');
        }, true);
      }

      editor.$qi_image_input = editor.shared.$qi_image_input;
      if (editor.helpers.isMobile()) editor.selection.save();
      editor.events.disableBlur();
      editor.$qi_image_input.data('inst', editor)[0].click();
    }
  });
  FE.RegisterQuickInsertButton('video', {
    icon: 'insertVideo',
    requiredPlugin: 'video',
    title: 'Insert Video',
    undo: false,
    callback: function callback() {
      var res = prompt(this.language.translate('Paste the URL of the video you want to insert.'));

      if (res) {
        this.video.insertByURL(res);
      }
    }
  });
  FE.RegisterQuickInsertButton('embedly', {
    icon: 'embedly',
    requiredPlugin: 'embedly',
    title: 'Embed URL',
    undo: false,
    callback: function callback() {
      var res = prompt(this.language.translate('Paste the URL of any web content you want to insert.'));

      if (res) {
        this.embedly.add(res);
      }
    }
  });
  FE.RegisterQuickInsertButton('table', {
    icon: 'insertTable',
    requiredPlugin: 'table',
    title: 'Insert Table',
    callback: function callback() {
      this.table.insert(2, 2);
    }
  });
  FE.RegisterQuickInsertButton('ol', {
    icon: 'formatOL',
    requiredPlugin: 'lists',
    title: 'Ordered List',
    callback: function callback() {
      this.lists.format('OL');
    }
  });
  FE.RegisterQuickInsertButton('ul', {
    icon: 'formatUL',
    requiredPlugin: 'lists',
    title: 'Unordered List',
    callback: function callback() {
      this.lists.format('UL');
    }
  });
  FE.RegisterQuickInsertButton('hr', {
    icon: 'insertHR',
    title: 'Insert Horizontal Line',
    callback: function callback() {
      this.commands.insertHR();
    }
  });

  FE.PLUGINS.quickInsert = function (editor) {
    var $ = editor.$;
    var $quick_insert;
    /*
     * Set the quick insert button left and top.
     */

    function _place($tag) {
      // Quick insert's possition.
      var qiTop;
      var qiLeft;
      var qiTagAlign;
      qiTop = $tag.offset().top - editor.$box.offset().top;

      if ((editor.$iframe && editor.$iframe.offset().left || 0) + $tag.offset().left < $quick_insert.outerWidth()) {
        qiLeft = $tag.offset().left + $quick_insert.outerWidth();
      } else {
        qiLeft = 0 - $quick_insert.outerWidth();
      }

      if (editor.opts.enter != FE.ENTER_BR) {
        qiTagAlign = ($quick_insert.outerHeight() - $tag.outerHeight()) / 2;
      } // Enter key is BR. Insert an empty SPAN to get line height.
      else {
          var $span = $(document.createElement('span')).html(FE.INVISIBLE_SPACE);
          $span.insertAfter($tag);
          qiTagAlign = ($quick_insert.outerHeight() - $tag.next().outerHeight()) / 2;
          $tag.next().remove();
        }

      if (editor.opts.iframe) {
        var iframePaddingTop = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-top'));
        qiTop += editor.$iframe.offset().top + iframePaddingTop;
      } // Reposition QI helper if visible.


      if ($quick_insert.hasClass('fr-on')) {
        if (qiTop >= 0) {
          $helper.css('top', qiTop - qiTagAlign);
        }
      } // Set quick insert's top and left.


      if (qiTop >= 0 && qiTop - Math.abs(qiTagAlign) <= editor.$box.outerHeight() - $tag.outerHeight()) {
        if ($quick_insert.hasClass('fr-hidden')) {
          if ($quick_insert.hasClass('fr-on')) _showQIHelper();
          $quick_insert.removeClass('fr-hidden');
        }

        $quick_insert.css('top', qiTop - qiTagAlign);
      } else if ($quick_insert.hasClass('fr-visible')) {
        $quick_insert.addClass('fr-hidden');

        _hideHelper();
      }

      $quick_insert.css('left', qiLeft);
    }
    /*
     * Show quick insert.
     * Compute top, left, width and show the quick insert.
     */


    function _show($tag) {
      if (!$quick_insert) _initquickInsert(); // Hide the quick insert helper if visible.

      if ($quick_insert.hasClass('fr-on')) {
        _hideHelper();
      }

      editor.$box.append($quick_insert); // Quick insert's possition.

      _place($tag);

      $quick_insert.data('tag', $tag); // Show the quick insert.

      $quick_insert.addClass('fr-visible');
    }
    /*
     * Check the tag where the cursor is.
     */


    function _checkTag() {
      // If editor has focus.
      if (editor.core.hasFocus()) {
        var tag = editor.selection.element(); // Get block tag if Enter key is not BR.

        if (editor.opts.enter != FE.ENTER_BR && !editor.node.isBlock(tag)) {
          tag = editor.node.blockParent(tag);
        }

        if (editor.opts.enter == FE.ENTER_BR && !editor.node.isBlock(tag)) {
          var deep_tag = editor.node.deepestParent(tag);
          if (deep_tag) tag = deep_tag;
        }

        var _enterInBR = function _enterInBR() {
          return editor.opts.enter != FE.ENTER_BR && editor.node.isEmpty(tag) && editor.opts.quickInsertTags.indexOf(tag.tagName.toLowerCase()) >= 0;
        };

        var _enterInP = function _enterInP() {
          return editor.opts.enter == FE.ENTER_BR && (tag.tagName == 'BR' && (!tag.previousSibling || tag.previousSibling.tagName == 'BR' || editor.node.isBlock(tag.previousSibling)) || editor.node.isEmpty(tag) && (!tag.previousSibling || tag.previousSibling.tagName == 'BR' || editor.node.isBlock(tag.previousSibling)) && (!tag.nextSibling || tag.nextSibling.tagName == 'BR' || editor.node.isBlock(tag.nextSibling)));
        };

        if (tag && (_enterInBR() || _enterInP())) {
          // If the quick insert is not repositioned, just close the helper.
          if ($quick_insert && $quick_insert.data('tag').is($(tag)) && $quick_insert.hasClass('fr-on')) {
            _hideHelper();
          } // If selection is collapsed.
          else if (editor.selection.isCollapsed()) {
              _show($(tag));
            }
        } // Quick insert should not be visible.
        else {
            hide();
          }
      }
    }
    /*
     * Hide quick insert.
     */


    function hide() {
      if ($quick_insert) {
        // Hide the quick insert helper if visible.
        if ($quick_insert.hasClass('fr-on')) {
          _hideHelper();
        } // Hide the quick insert.


        $quick_insert.removeClass('fr-visible fr-on');
        $quick_insert.css('left', -9999).css('top', -9999);
      }
    }
    /*
     * Show the quick insert helper.
     */


    var $helper;

    function _showQIHelper(e) {
      if (e) e.preventDefault(); // Hide helper.

      if ($quick_insert.hasClass('fr-on') && !$quick_insert.hasClass('fr-hidden')) {
        _hideHelper();
      } else {
        if (!editor.shared.$qi_helper) {
          var btns = editor.opts.quickInsertButtons;
          var btns_html = '<div class="fr-qi-helper">';
          var idx = 0;

          for (var i = 0; i < btns.length; i++) {
            var info = FE.QUICK_INSERT_BUTTONS[btns[i]];

            if (info) {
              if (!info.requiredPlugin || FE.PLUGINS[info.requiredPlugin] && editor.opts.pluginsEnabled.indexOf(info.requiredPlugin) >= 0) {
                btns_html += '<a class="fr-btn fr-floating-btn" role="button" title="' + editor.language.translate(info.title) + '" tabIndex="-1" data-cmd="' + btns[i] + '" style="transition-delay: ' + 0.025 * idx++ + 's;">' + editor.icon.create(info.icon) + '</a>';
              }
            }
          }

          btns_html += '</div>';
          editor.shared.$qi_helper = $(btns_html); // Quick insert helper tooltip.

          editor.tooltip.bind(editor.shared.$qi_helper, 'a.fr-btn');
          editor.events.$on(editor.shared.$qi_helper, 'mousedown', function (e) {
            e.preventDefault();
          }, true);
        }

        $helper = editor.shared.$qi_helper;
        editor.$box.append($helper); // Show the quick insert helper.

        setTimeout(function () {
          $helper.css('top', parseFloat($quick_insert.css('top')));
          $helper.css('left', parseFloat($quick_insert.css('left')) + $quick_insert.outerWidth());
          $helper.find('a').addClass('fr-size-1');
          $quick_insert.addClass('fr-on');
        }, 10);
      }
    }
    /*
     * Hides the quick insert helper and places the cursor.
     */


    function _hideHelper() {
      var $helper = editor.$box.find('.fr-qi-helper');
      var transition_delay = 25; //transition delay on fade in was set 0.025s

      if ($helper.length) {
        (function () {
          //set transition effect for quick insert link items on hide starting from last child
          var childItems = $helper.find('a'); //get all the buttons from quick insert menu

          var index = 0; //hide the quick insert buttons starting from lefmost button with increase in delay to the righmost button

          for (; index < childItems.length; index++) {
            (function (index) {
              setTimeout(function () {
                $helper.children().eq(childItems.length - 1 - index).removeClass('fr-size-1'); //removing class to hide the button
              }, transition_delay * index); //set the increasing transition delay
            })(index);
          } //remove on button and set back add button


          setTimeout(function () {
            $helper.css('left', -9999);
            if ($quick_insert && !$quick_insert.hasClass('fr-hidden')) $quick_insert.removeClass('fr-on'); //show Add button
          }, transition_delay * index); //set the transition delay for Add button
        })();
      }
    }
    /*
     * Initialize the quick insert.
     */


    function _initquickInsert() {
      if (!editor.shared.$quick_insert) {
        // Append quick insert HTML to editor wrapper.
        editor.shared.$quick_insert = $(document.createElement('div')).attr('class', 'fr-quick-insert').html('<a class="fr-floating-btn" role="button" tabIndex="-1" title="' + editor.language.translate('Quick Insert') + '">' + editor.icon.create('quickInsert') + '</a>'); //'<div class="fr-quick-insert"><a class="fr-floating-btn" role="button" tabIndex="-1" title="' + editor.language.translate('Quick Insert') + '">' + editor.icon.create('quickInsert') + '</a></div>')
      }

      $quick_insert = editor.shared.$quick_insert; // Quick Insert tooltip.

      editor.tooltip.bind(editor.$box, '.fr-quick-insert > a.fr-floating-btn'); // Editor destroy.

      editor.events.on('destroy', function () {
        $('body').first().append($quick_insert.removeClass('fr-on'));

        if ($helper) {
          _hideHelper();

          $('body').first().append($helper.css('left', -9999).css('top', -9999));
        }
      }, true);
      editor.events.on('shared.destroy', function () {
        $quick_insert.html('').removeData().remove();
        $quick_insert = null;

        if ($helper) {
          $helper.html('').removeData().remove();
          $helper = null;
        }
      }, true); // Hide before a command is executed.

      editor.events.on('commands.before', hide); // Check if the quick insert should be shown after a command has been executed.

      editor.events.on('commands.after', function () {
        if (!editor.popups.areVisible()) {
          _checkTag();
        }
      }); // User clicks on the quick insert.

      editor.events.bindClick(editor.$box, '.fr-quick-insert > a', _showQIHelper); // User clicks on a button from the quick insert helper.

      editor.events.bindClick(editor.$box, '.fr-qi-helper > a.fr-btn', function (e) {
        var cmd = $(e.currentTarget).data('cmd'); // Trigger commands.before.

        if (editor.events.trigger('quickInsert.commands.before', [cmd]) === false) {
          return false;
        }

        FE.QUICK_INSERT_BUTTONS[cmd].callback.apply(editor, [e.currentTarget]);

        if (FE.QUICK_INSERT_BUTTONS[cmd].undo) {
          editor.undo.saveStep();
        } // Trigger commands.after.


        editor.events.trigger('quickInsert.commands.after', [cmd]);
        editor.quickInsert.hide();
      }); // Scroll in editor wrapper. Quick insert buttons should scroll along

      editor.events.$on(editor.$wp, 'scroll', _repositionQIButton); // Re-position the quick insert button when more toolbar is expanded completely

      editor.events.$on(editor.$tb, 'transitionend', '.fr-more-toolbar', _repositionQIButton);
    }
    /**
     * Reposition the quick insert button
     */


    function _repositionQIButton() {
      if ($quick_insert.hasClass('fr-visible')) {
        _place($quick_insert.data('tag'));
      }
    }
    /*
     * Tear up.
     */


    function _init() {
      if (!editor.$wp || !editor.opts.quickInsertEnabled) return false; // Hide the quick insert if user click on an image.

      editor.popups.onShow('image.edit', hide); // Check tag where cursor is to see if the quick insert needs to be shown.

      editor.events.on('mouseup', _checkTag);

      if (editor.helpers.isMobile()) {
        editor.events.$on($(editor.o_doc), 'selectionchange', _checkTag);
      } // Hide the quick insert when editor loses focus.


      editor.events.on('blur', hide); // Check if the quick insert should be shown after a key was pressed.

      editor.events.on('keyup', _checkTag); // Hide quick insert on keydown.

      editor.events.on('keydown', function () {
        setTimeout(function () {
          _checkTag();
        }, 0);
      });
    }

    return {
      _init: _init,
      hide: hide
    };
  };

  FE.PLUGINS.quote = function (editor) {
    var $ = editor.$;

    function _deepestParent(node) {
      while (node.parentNode && node.parentNode != editor.el) {
        node = node.parentNode;
      }

      return node;
    }

    function _increase() {
      // Get blocks.
      var blocks = editor.selection.blocks();
      var i; // Normalize blocks.

      for (i = 0; i < blocks.length; i++) {
        blocks[i] = _deepestParent(blocks[i]);
      } // Save selection to restore it later.


      editor.selection.save();
      var $quote = $(document.createElement('blockquote'));
      $quote.insertBefore(blocks[0]);

      for (i = 0; i < blocks.length; i++) {
        $quote.append(blocks[i]);
      } // Unwrap temp divs.


      editor.html.unwrap();
      editor.selection.restore();
    }

    function _decrease() {
      // Get blocks.
      var blocks = editor.selection.blocks();
      var i;

      for (i = 0; i < blocks.length; i++) {
        if (blocks[i].tagName != 'BLOCKQUOTE') {
          blocks[i] = $(blocks[i]).parentsUntil(editor.$el, 'BLOCKQUOTE').get(0);
        }
      }

      editor.selection.save();

      for (i = 0; i < blocks.length; i++) {
        if (blocks[i]) {
          $(blocks[i]).replaceWith(blocks[i].innerHTML);
        }
      } // Unwrap temp divs.


      editor.html.unwrap();
      editor.selection.restore();
    }

    function apply(val) {
      // Wrap.
      editor.selection.save();
      editor.html.wrap(true, true, true, true);
      editor.selection.restore();

      if (val == 'increase') {
        _increase();
      } else if (val == 'decrease') {
        _decrease();
      }
    }

    return {
      apply: apply
    };
  }; // Register the quote command.


  FE.RegisterShortcut(FE.KEYCODE.SINGLE_QUOTE, 'quote', 'increase', '\'');
  FE.RegisterShortcut(FE.KEYCODE.SINGLE_QUOTE, 'quote', 'decrease', '\'', true);
  FE.RegisterCommand('quote', {
    title: 'Quote',
    type: 'dropdown',
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = {
        increase: 'Increase',
        decrease: 'Decrease'
      };

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          var shortcut = this.shortcuts.get('quote.' + val);
          c += '<li role="presentation"><a class="fr-command fr-active ' + val + '" tabIndex="-1" role="option" data-cmd="quote" data-param1="' + val + '" title="' + options[val] + '">' + this.language.translate(options[val]) + (shortcut ? '<span class="fr-shortcut">' + shortcut + '</span>' : '') + '</a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      this.quote.apply(val);
    },
    plugin: 'quote'
  }); // Add the quote icon.

  FE.DefineIcon('quote', {
    NAME: 'quote-left',
    SVG_KEY: 'blockquote'
  });

  Object.assign(FE.DEFAULTS, {
    saveInterval: 10000,
    saveURL: null,
    saveParams: {},
    saveParam: 'body',
    saveMethod: 'POST'
  });

  FE.PLUGINS.save = function (editor) {
    var $ = editor.$;
    var _timeout = null;
    var _last_html = null;
    var _force = false;
    var BAD_LINK = 1;
    var ERROR_ON_SERVER = 2;
    var error_messages = {};
    error_messages[BAD_LINK] = 'Missing saveURL option.';
    error_messages[ERROR_ON_SERVER] = 'Something went wrong during save.';
    /**
     * Throw an image error.
     */

    function _throwError(code, response) {
      editor.events.trigger('save.error', [{
        code: code,
        message: error_messages[code]
      }, response]);
    }

    function save(html) {
      if (typeof html == 'undefined') html = editor.html.get();
      var original_html = html; // Trigger before save event.

      var event_returned_value = editor.events.trigger('save.before', [html]);
      if (event_returned_value === false) return false;else if (typeof event_returned_value == 'string') html = event_returned_value;

      if (editor.opts.saveURL) {
        var params = {};

        for (var key in editor.opts.saveParams) {
          if (editor.opts.saveParams.hasOwnProperty(key)) {
            var param = editor.opts.saveParams[key];

            if (typeof param == 'function') {
              params[key] = param.call(this);
            } else {
              params[key] = param;
            }
          }
        }

        var dt = {};
        dt[editor.opts.saveParam] = html; // Make request to save

        $(this).ajax({
          method: editor.opts.saveMethod,
          url: editor.opts.saveURL,
          data: Object.assign(dt, params),
          crossDomain: editor.opts.requestWithCORS,
          withCredentials: editor.opts.requestWithCredentials,
          headers: editor.opts.requestHeaders,
          done: function done(data, status, xhr) {
            _last_html = original_html; // data

            editor.events.trigger('save.after', [data]);
          },
          fail: function fail(xhr) {
            // (error)
            _throwError(ERROR_ON_SERVER, xhr.response || xhr.responseText);
          }
        });
      } else {
        // (error)
        _throwError(BAD_LINK);
      }
    }

    function _mightSave() {
      clearTimeout(_timeout);
      _timeout = setTimeout(function () {
        var html = editor.html.get();

        if (_last_html != html || _force) {
          _last_html = html;
          _force = false;
          save(html);
        }
      }, editor.opts.saveInterval);
    }
    /**
     * Reset the saving interval.
     */


    function reset() {
      _mightSave();

      _force = false;
    }
    /**
     * Force saving at the end of the current interval.
     */


    function force() {
      _force = true;
    }
    /*
     * Initialize.
     */


    function _init() {
      if (editor.opts.saveInterval) {
        _last_html = editor.html.get();
        editor.events.on('contentChanged', _mightSave);
        editor.events.on('keydown destroy', function () {
          clearTimeout(_timeout);
        });
      }
    }

    return {
      _init: _init,
      save: save,
      reset: reset,
      force: force
    };
  };

  FE.DefineIcon('save', {
    NAME: 'floppy-o',
    FA5NAME: 'save'
  });
  FE.RegisterCommand('save', {
    title: 'Save',
    undo: false,
    focus: false,
    refreshAfterCallback: false,
    callback: function callback() {
      this.save.save();
    },
    plugin: 'save'
  });

  Object.assign(FE.DEFAULTS, {
    specialCharactersSets: [{
      title: 'Latin',
      "char": '&iexcl;',
      list: [{
        'char': '&iexcl;',
        desc: 'INVERTED EXCLAMATION MARK'
      }, {
        'char': '&cent;',
        desc: 'CENT SIGN'
      }, {
        'char': '&pound;',
        desc: 'POUND SIGN'
      }, {
        'char': '&curren;',
        desc: 'CURRENCY SIGN'
      }, {
        'char': '&yen;',
        desc: 'YEN SIGN'
      }, {
        'char': '&brvbar;',
        desc: 'BROKEN BAR'
      }, {
        'char': '&sect;',
        desc: 'SECTION SIGN'
      }, {
        'char': '&uml;',
        desc: 'DIAERESIS'
      }, {
        'char': '&copy;',
        desc: 'COPYRIGHT SIGN'
      }, {
        'char': '&trade;',
        desc: 'TRADEMARK SIGN'
      }, {
        'char': '&ordf;',
        desc: 'FEMININE ORDINAL INDICATOR'
      }, {
        'char': '&laquo;',
        desc: 'LEFT-POINTING DOUBLE ANGLE QUOTATION MARK'
      }, {
        'char': '&not;',
        desc: 'NOT SIGN'
      }, {
        'char': '&reg;',
        desc: 'REGISTERED SIGN'
      }, {
        'char': '&macr;',
        desc: 'MACRON'
      }, {
        'char': '&deg;',
        desc: 'DEGREE SIGN'
      }, {
        'char': '&plusmn;',
        desc: 'PLUS-MINUS SIGN'
      }, {
        'char': '&sup2;',
        desc: 'SUPERSCRIPT TWO'
      }, {
        'char': '&sup3;',
        desc: 'SUPERSCRIPT THREE'
      }, {
        'char': '&acute;',
        desc: 'ACUTE ACCENT'
      }, {
        'char': '&micro;',
        desc: 'MICRO SIGN'
      }, {
        'char': '&para;',
        desc: 'PILCROW SIGN'
      }, {
        'char': '&middot;',
        desc: 'MIDDLE DOT'
      }, {
        'char': '&cedil;',
        desc: 'CEDILLA'
      }, {
        'char': '&sup1;',
        desc: 'SUPERSCRIPT ONE'
      }, {
        'char': '&ordm;',
        desc: 'MASCULINE ORDINAL INDICATOR'
      }, {
        'char': '&raquo;',
        desc: 'RIGHT-POINTING DOUBLE ANGLE QUOTATION MARK'
      }, {
        'char': '&frac14;',
        desc: 'VULGAR FRACTION ONE QUARTER'
      }, {
        'char': '&frac12;',
        desc: 'VULGAR FRACTION ONE HALF'
      }, {
        'char': '&frac34;',
        desc: 'VULGAR FRACTION THREE QUARTERS'
      }, {
        'char': '&iquest;',
        desc: 'INVERTED QUESTION MARK'
      }, {
        'char': '&Agrave;',
        desc: 'LATIN CAPITAL LETTER A WITH GRAVE'
      }, {
        'char': '&Aacute;',
        desc: 'LATIN CAPITAL LETTER A WITH ACUTE'
      }, {
        'char': '&Acirc;',
        desc: 'LATIN CAPITAL LETTER A WITH CIRCUMFLEX'
      }, {
        'char': '&Atilde;',
        desc: 'LATIN CAPITAL LETTER A WITH TILDE'
      }, {
        'char': '&Auml;',
        desc: 'LATIN CAPITAL LETTER A WITH DIAERESIS '
      }, {
        'char': '&Aring;',
        desc: 'LATIN CAPITAL LETTER A WITH RING ABOVE'
      }, {
        'char': '&AElig;',
        desc: 'LATIN CAPITAL LETTER AE'
      }, {
        'char': '&Ccedil;',
        desc: 'LATIN CAPITAL LETTER C WITH CEDILLA'
      }, {
        'char': '&Egrave;',
        desc: 'LATIN CAPITAL LETTER E WITH GRAVE'
      }, {
        'char': '&Eacute;',
        desc: 'LATIN CAPITAL LETTER E WITH ACUTE'
      }, {
        'char': '&Ecirc;',
        desc: 'LATIN CAPITAL LETTER E WITH CIRCUMFLEX'
      }, {
        'char': '&Euml;',
        desc: 'LATIN CAPITAL LETTER E WITH DIAERESIS'
      }, {
        'char': '&Igrave;',
        desc: 'LATIN CAPITAL LETTER I WITH GRAVE'
      }, {
        'char': '&Iacute;',
        desc: 'LATIN CAPITAL LETTER I WITH ACUTE'
      }, {
        'char': '&Icirc;',
        desc: 'LATIN CAPITAL LETTER I WITH CIRCUMFLEX'
      }, {
        'char': '&Iuml;',
        desc: 'LATIN CAPITAL LETTER I WITH DIAERESIS'
      }, {
        'char': '&ETH;',
        desc: 'LATIN CAPITAL LETTER ETH'
      }, {
        'char': '&Ntilde;',
        desc: 'LATIN CAPITAL LETTER N WITH TILDE'
      }, {
        'char': '&Ograve;',
        desc: 'LATIN CAPITAL LETTER O WITH GRAVE'
      }, {
        'char': '&Oacute;',
        desc: 'LATIN CAPITAL LETTER O WITH ACUTE'
      }, {
        'char': '&Ocirc;',
        desc: 'LATIN CAPITAL LETTER O WITH CIRCUMFLEX'
      }, {
        'char': '&Otilde;',
        desc: 'LATIN CAPITAL LETTER O WITH TILDE'
      }, {
        'char': '&Ouml;',
        desc: 'LATIN CAPITAL LETTER O WITH DIAERESIS'
      }, {
        'char': '&times;',
        desc: 'MULTIPLICATION SIGN'
      }, {
        'char': '&Oslash;',
        desc: 'LATIN CAPITAL LETTER O WITH STROKE'
      }, {
        'char': '&Ugrave;',
        desc: 'LATIN CAPITAL LETTER U WITH GRAVE'
      }, {
        'char': '&Uacute;',
        desc: 'LATIN CAPITAL LETTER U WITH ACUTE'
      }, {
        'char': '&Ucirc;',
        desc: 'LATIN CAPITAL LETTER U WITH CIRCUMFLEX'
      }, {
        'char': '&Uuml;',
        desc: 'LATIN CAPITAL LETTER U WITH DIAERESIS'
      }, {
        'char': '&Yacute;',
        desc: 'LATIN CAPITAL LETTER Y WITH ACUTE'
      }, {
        'char': '&THORN;',
        desc: 'LATIN CAPITAL LETTER THORN'
      }, {
        'char': '&szlig;',
        desc: 'LATIN SMALL LETTER SHARP S'
      }, {
        'char': '&agrave;',
        desc: 'LATIN SMALL LETTER A WITH GRAVE'
      }, {
        'char': '&aacute;',
        desc: 'LATIN SMALL LETTER A WITH ACUTE '
      }, {
        'char': '&acirc;',
        desc: 'LATIN SMALL LETTER A WITH CIRCUMFLEX'
      }, {
        'char': '&atilde;',
        desc: 'LATIN SMALL LETTER A WITH TILDE'
      }, {
        'char': '&auml;',
        desc: 'LATIN SMALL LETTER A WITH DIAERESIS'
      }, {
        'char': '&aring;',
        desc: 'LATIN SMALL LETTER A WITH RING ABOVE'
      }, {
        'char': '&aelig;',
        desc: 'LATIN SMALL LETTER AE'
      }, {
        'char': '&ccedil;',
        desc: 'LATIN SMALL LETTER C WITH CEDILLA'
      }, {
        'char': '&egrave;',
        desc: 'LATIN SMALL LETTER E WITH GRAVE'
      }, {
        'char': '&eacute;',
        desc: 'LATIN SMALL LETTER E WITH ACUTE'
      }, {
        'char': '&ecirc;',
        desc: 'LATIN SMALL LETTER E WITH CIRCUMFLEX'
      }, {
        'char': '&euml;',
        desc: 'LATIN SMALL LETTER E WITH DIAERESIS'
      }, {
        'char': '&igrave;',
        desc: 'LATIN SMALL LETTER I WITH GRAVE'
      }, {
        'char': '&iacute;',
        desc: 'LATIN SMALL LETTER I WITH ACUTE'
      }, {
        'char': '&icirc;',
        desc: 'LATIN SMALL LETTER I WITH CIRCUMFLEX'
      }, {
        'char': '&iuml;',
        desc: 'LATIN SMALL LETTER I WITH DIAERESIS'
      }, {
        'char': '&eth;',
        desc: 'LATIN SMALL LETTER ETH'
      }, {
        'char': '&ntilde;',
        desc: 'LATIN SMALL LETTER N WITH TILDE'
      }, {
        'char': '&ograve;',
        desc: 'LATIN SMALL LETTER O WITH GRAVE'
      }, {
        'char': '&oacute;',
        desc: 'LATIN SMALL LETTER O WITH ACUTE'
      }, {
        'char': '&ocirc;',
        desc: 'LATIN SMALL LETTER O WITH CIRCUMFLEX'
      }, {
        'char': '&otilde;',
        desc: 'LATIN SMALL LETTER O WITH TILDE'
      }, {
        'char': '&ouml;',
        desc: 'LATIN SMALL LETTER O WITH DIAERESIS'
      }, {
        'char': '&divide;',
        desc: 'DIVISION SIGN'
      }, {
        'char': '&oslash;',
        desc: 'LATIN SMALL LETTER O WITH STROKE'
      }, {
        'char': '&ugrave;',
        desc: 'LATIN SMALL LETTER U WITH GRAVE'
      }, {
        'char': '&uacute;',
        desc: 'LATIN SMALL LETTER U WITH ACUTE'
      }, {
        'char': '&ucirc;',
        desc: 'LATIN SMALL LETTER U WITH CIRCUMFLEX'
      }, {
        'char': '&uuml;',
        desc: 'LATIN SMALL LETTER U WITH DIAERESIS'
      }, {
        'char': '&yacute;',
        desc: 'LATIN SMALL LETTER Y WITH ACUTE'
      }, {
        'char': '&thorn;',
        desc: 'LATIN SMALL LETTER THORN'
      }, {
        'char': '&yuml;',
        desc: 'LATIN SMALL LETTER Y WITH DIAERESIS'
      }]
    }, {
      title: 'Greek',
      "char": '&Alpha;',
      list: [{
        'char': '&Alpha;',
        desc: 'GREEK CAPITAL LETTER ALPHA'
      }, {
        'char': '&Beta;',
        desc: 'GREEK CAPITAL LETTER BETA'
      }, {
        'char': '&Gamma;',
        desc: 'GREEK CAPITAL LETTER GAMMA'
      }, {
        'char': '&Delta;',
        desc: 'GREEK CAPITAL LETTER DELTA'
      }, {
        'char': '&Epsilon;',
        desc: 'GREEK CAPITAL LETTER EPSILON'
      }, {
        'char': '&Zeta;',
        desc: 'GREEK CAPITAL LETTER ZETA'
      }, {
        'char': '&Eta;',
        desc: 'GREEK CAPITAL LETTER ETA'
      }, {
        'char': '&Theta;',
        desc: 'GREEK CAPITAL LETTER THETA'
      }, {
        'char': '&Iota;',
        desc: 'GREEK CAPITAL LETTER IOTA'
      }, {
        'char': '&Kappa;',
        desc: 'GREEK CAPITAL LETTER KAPPA'
      }, {
        'char': '&Lambda;',
        desc: 'GREEK CAPITAL LETTER LAMBDA'
      }, {
        'char': '&Mu;',
        desc: 'GREEK CAPITAL LETTER MU'
      }, {
        'char': '&Nu;',
        desc: 'GREEK CAPITAL LETTER NU'
      }, {
        'char': '&Xi;',
        desc: 'GREEK CAPITAL LETTER XI'
      }, {
        'char': '&Omicron;',
        desc: 'GREEK CAPITAL LETTER OMICRON'
      }, {
        'char': '&Pi;',
        desc: 'GREEK CAPITAL LETTER PI'
      }, {
        'char': '&Rho;',
        desc: 'GREEK CAPITAL LETTER RHO'
      }, {
        'char': '&Sigma;',
        desc: 'GREEK CAPITAL LETTER SIGMA'
      }, {
        'char': '&Tau;',
        desc: 'GREEK CAPITAL LETTER TAU'
      }, {
        'char': '&Upsilon;',
        desc: 'GREEK CAPITAL LETTER UPSILON'
      }, {
        'char': '&Phi;',
        desc: 'GREEK CAPITAL LETTER PHI'
      }, {
        'char': '&Chi;',
        desc: 'GREEK CAPITAL LETTER CHI'
      }, {
        'char': '&Psi;',
        desc: 'GREEK CAPITAL LETTER PSI'
      }, {
        'char': '&Omega;',
        desc: 'GREEK CAPITAL LETTER OMEGA'
      }, {
        'char': '&alpha;',
        desc: 'GREEK SMALL LETTER ALPHA'
      }, {
        'char': '&beta;',
        desc: 'GREEK SMALL LETTER BETA'
      }, {
        'char': '&gamma;',
        desc: 'GREEK SMALL LETTER GAMMA'
      }, {
        'char': '&delta;',
        desc: 'GREEK SMALL LETTER DELTA'
      }, {
        'char': '&epsilon;',
        desc: 'GREEK SMALL LETTER EPSILON'
      }, {
        'char': '&zeta;',
        desc: 'GREEK SMALL LETTER ZETA'
      }, {
        'char': '&eta;',
        desc: 'GREEK SMALL LETTER ETA'
      }, {
        'char': '&theta;',
        desc: 'GREEK SMALL LETTER THETA'
      }, {
        'char': '&iota;',
        desc: 'GREEK SMALL LETTER IOTA'
      }, {
        'char': '&kappa;',
        desc: 'GREEK SMALL LETTER KAPPA'
      }, {
        'char': '&lambda;',
        desc: 'GREEK SMALL LETTER LAMBDA'
      }, {
        'char': '&mu;',
        desc: 'GREEK SMALL LETTER MU'
      }, {
        'char': '&nu;',
        desc: 'GREEK SMALL LETTER NU'
      }, {
        'char': '&xi;',
        desc: 'GREEK SMALL LETTER XI'
      }, {
        'char': '&omicron;',
        desc: 'GREEK SMALL LETTER OMICRON'
      }, {
        'char': '&pi;',
        desc: 'GREEK SMALL LETTER PI'
      }, {
        'char': '&rho;',
        desc: 'GREEK SMALL LETTER RHO'
      }, {
        'char': '&sigmaf;',
        desc: 'GREEK SMALL LETTER FINAL SIGMA'
      }, {
        'char': '&sigma;',
        desc: 'GREEK SMALL LETTER SIGMA'
      }, {
        'char': '&tau;',
        desc: 'GREEK SMALL LETTER TAU'
      }, {
        'char': '&upsilon;',
        desc: 'GREEK SMALL LETTER UPSILON'
      }, {
        'char': '&phi;',
        desc: 'GREEK SMALL LETTER PHI'
      }, {
        'char': '&chi;',
        desc: 'GREEK SMALL LETTER CHI'
      }, {
        'char': '&psi;',
        desc: 'GREEK SMALL LETTER PSI'
      }, {
        'char': '&omega;',
        desc: 'GREEK SMALL LETTER OMEGA'
      }, {
        'char': '&thetasym;',
        desc: 'GREEK THETA SYMBOL'
      }, {
        'char': '&upsih;',
        desc: 'GREEK UPSILON WITH HOOK SYMBOL'
      }, {
        'char': '&straightphi;',
        desc: 'GREEK PHI SYMBOL'
      }, {
        'char': '&piv;',
        desc: 'GREEK PI SYMBOL'
      }, {
        'char': '&Gammad;',
        desc: 'GREEK LETTER DIGAMMA'
      }, {
        'char': '&gammad;',
        desc: 'GREEK SMALL LETTER DIGAMMA'
      }, {
        'char': '&varkappa;',
        desc: 'GREEK KAPPA SYMBOL'
      }, {
        'char': '&varrho;',
        desc: 'GREEK RHO SYMBOL'
      }, {
        'char': '&straightepsilon;',
        desc: 'GREEK LUNATE EPSILON SYMBOL'
      }, {
        'char': '&backepsilon;',
        desc: 'GREEK REVERSED LUNATE EPSILON SYMBOL'
      }]
    }, {
      title: 'Cyrillic',
      "char": '&#x400',
      list: [{
        'char': '&#x400',
        desc: 'CYRILLIC CAPITAL LETTER IE WITH GRAVE'
      }, {
        'char': '&#x401',
        desc: 'CYRILLIC CAPITAL LETTER IO'
      }, {
        'char': '&#x402',
        desc: 'CYRILLIC CAPITAL LETTER DJE'
      }, {
        'char': '&#x403',
        desc: 'CYRILLIC CAPITAL LETTER GJE'
      }, {
        'char': '&#x404',
        desc: 'CYRILLIC CAPITAL LETTER UKRAINIAN IE'
      }, {
        'char': '&#x405',
        desc: 'CYRILLIC CAPITAL LETTER DZE'
      }, {
        'char': '&#x406',
        desc: 'CYRILLIC CAPITAL LETTER BYELORUSSIAN-UKRAINIAN I'
      }, {
        'char': '&#x407',
        desc: 'CYRILLIC CAPITAL LETTER YI'
      }, {
        'char': '&#x408',
        desc: 'CYRILLIC CAPITAL LETTER JE'
      }, {
        'char': '&#x409',
        desc: 'CYRILLIC CAPITAL LETTER LJE'
      }, {
        'char': '&#x40A',
        desc: 'CYRILLIC CAPITAL LETTER NJE'
      }, {
        'char': '&#x40B',
        desc: 'CYRILLIC CAPITAL LETTER TSHE'
      }, {
        'char': '&#x40C',
        desc: 'CYRILLIC CAPITAL LETTER KJE'
      }, {
        'char': '&#x40D',
        desc: 'CYRILLIC CAPITAL LETTER I WITH GRAVE'
      }, {
        'char': '&#x40E',
        desc: 'CYRILLIC CAPITAL LETTER SHORT U'
      }, {
        'char': '&#x40F',
        desc: 'CYRILLIC CAPITAL LETTER DZHE'
      }, {
        'char': '&#x410',
        desc: 'CYRILLIC CAPITAL LETTER A'
      }, {
        'char': '&#x411',
        desc: 'CYRILLIC CAPITAL LETTER BE'
      }, {
        'char': '&#x412',
        desc: 'CYRILLIC CAPITAL LETTER VE'
      }, {
        'char': '&#x413',
        desc: 'CYRILLIC CAPITAL LETTER GHE'
      }, {
        'char': '&#x414',
        desc: 'CYRILLIC CAPITAL LETTER DE'
      }, {
        'char': '&#x415',
        desc: 'CYRILLIC CAPITAL LETTER IE'
      }, {
        'char': '&#x416',
        desc: 'CYRILLIC CAPITAL LETTER ZHE'
      }, {
        'char': '&#x417',
        desc: 'CYRILLIC CAPITAL LETTER ZE'
      }, {
        'char': '&#x418',
        desc: 'CYRILLIC CAPITAL LETTER I'
      }, {
        'char': '&#x419',
        desc: 'CYRILLIC CAPITAL LETTER SHORT I'
      }, {
        'char': '&#x41A',
        desc: 'CYRILLIC CAPITAL LETTER KA'
      }, {
        'char': '&#x41B',
        desc: 'CYRILLIC CAPITAL LETTER EL'
      }, {
        'char': '&#x41C',
        desc: 'CYRILLIC CAPITAL LETTER EM'
      }, {
        'char': '&#x41D',
        desc: 'CYRILLIC CAPITAL LETTER EN'
      }, {
        'char': '&#x41E',
        desc: 'CYRILLIC CAPITAL LETTER O'
      }, {
        'char': '&#x41F',
        desc: 'CYRILLIC CAPITAL LETTER PE'
      }, {
        'char': '&#x420',
        desc: 'CYRILLIC CAPITAL LETTER ER'
      }, {
        'char': '&#x421',
        desc: 'CYRILLIC CAPITAL LETTER ES'
      }, {
        'char': '&#x422',
        desc: 'CYRILLIC CAPITAL LETTER TE'
      }, {
        'char': '&#x423',
        desc: 'CYRILLIC CAPITAL LETTER U'
      }, {
        'char': '&#x424',
        desc: 'CYRILLIC CAPITAL LETTER EF'
      }, {
        'char': '&#x425',
        desc: 'CYRILLIC CAPITAL LETTER HA'
      }, {
        'char': '&#x426',
        desc: 'CYRILLIC CAPITAL LETTER TSE'
      }, {
        'char': '&#x427',
        desc: 'CYRILLIC CAPITAL LETTER CHE'
      }, {
        'char': '&#x428',
        desc: 'CYRILLIC CAPITAL LETTER SHA'
      }, {
        'char': '&#x429',
        desc: 'CYRILLIC CAPITAL LETTER SHCHA'
      }, {
        'char': '&#x42A',
        desc: 'CYRILLIC CAPITAL LETTER HARD SIGN'
      }, {
        'char': '&#x42B',
        desc: 'CYRILLIC CAPITAL LETTER YERU'
      }, {
        'char': '&#x42C',
        desc: 'CYRILLIC CAPITAL LETTER SOFT SIGN'
      }, {
        'char': '&#x42D',
        desc: 'CYRILLIC CAPITAL LETTER E'
      }, {
        'char': '&#x42E',
        desc: 'CYRILLIC CAPITAL LETTER YU'
      }, {
        'char': '&#x42F',
        desc: 'CYRILLIC CAPITAL LETTER YA'
      }, {
        'char': '&#x430',
        desc: 'CYRILLIC SMALL LETTER A'
      }, {
        'char': '&#x431',
        desc: 'CYRILLIC SMALL LETTER BE'
      }, {
        'char': '&#x432',
        desc: 'CYRILLIC SMALL LETTER VE'
      }, {
        'char': '&#x433',
        desc: 'CYRILLIC SMALL LETTER GHE'
      }, {
        'char': '&#x434',
        desc: 'CYRILLIC SMALL LETTER DE'
      }, {
        'char': '&#x435',
        desc: 'CYRILLIC SMALL LETTER IE'
      }, {
        'char': '&#x436',
        desc: 'CYRILLIC SMALL LETTER ZHE'
      }, {
        'char': '&#x437',
        desc: 'CYRILLIC SMALL LETTER ZE'
      }, {
        'char': '&#x438',
        desc: 'CYRILLIC SMALL LETTER I'
      }, {
        'char': '&#x439',
        desc: 'CYRILLIC SMALL LETTER SHORT I'
      }, {
        'char': '&#x43A',
        desc: 'CYRILLIC SMALL LETTER KA'
      }, {
        'char': '&#x43B',
        desc: 'CYRILLIC SMALL LETTER EL'
      }, {
        'char': '&#x43C',
        desc: 'CYRILLIC SMALL LETTER EM'
      }, {
        'char': '&#x43D',
        desc: 'CYRILLIC SMALL LETTER EN'
      }, {
        'char': '&#x43E',
        desc: 'CYRILLIC SMALL LETTER O'
      }, {
        'char': '&#x43F',
        desc: 'CYRILLIC SMALL LETTER PE'
      }, {
        'char': '&#x440',
        desc: 'CYRILLIC SMALL LETTER ER'
      }, {
        'char': '&#x441',
        desc: 'CYRILLIC SMALL LETTER ES'
      }, {
        'char': '&#x442',
        desc: 'CYRILLIC SMALL LETTER TE'
      }, {
        'char': '&#x443',
        desc: 'CYRILLIC SMALL LETTER U'
      }, {
        'char': '&#x444',
        desc: 'CYRILLIC SMALL LETTER EF'
      }, {
        'char': '&#x445',
        desc: 'CYRILLIC SMALL LETTER HA'
      }, {
        'char': '&#x446',
        desc: 'CYRILLIC SMALL LETTER TSE'
      }, {
        'char': '&#x447',
        desc: 'CYRILLIC SMALL LETTER CHE'
      }, {
        'char': '&#x448',
        desc: 'CYRILLIC SMALL LETTER SHA'
      }, {
        'char': '&#x449',
        desc: 'CYRILLIC SMALL LETTER SHCHA'
      }, {
        'char': '&#x44A',
        desc: 'CYRILLIC SMALL LETTER HARD SIGN'
      }, {
        'char': '&#x44B',
        desc: 'CYRILLIC SMALL LETTER YERU'
      }, {
        'char': '&#x44C',
        desc: 'CYRILLIC SMALL LETTER SOFT SIGN'
      }, {
        'char': '&#x44D',
        desc: 'CYRILLIC SMALL LETTER E'
      }, {
        'char': '&#x44E',
        desc: 'CYRILLIC SMALL LETTER YU'
      }, {
        'char': '&#x44F',
        desc: 'CYRILLIC SMALL LETTER YA'
      }, {
        'char': '&#x450',
        desc: 'CYRILLIC SMALL LETTER IE WITH GRAVE'
      }, {
        'char': '&#x451',
        desc: 'CYRILLIC SMALL LETTER IO'
      }, {
        'char': '&#x452',
        desc: 'CYRILLIC SMALL LETTER DJE'
      }, {
        'char': '&#x453',
        desc: 'CYRILLIC SMALL LETTER GJE'
      }, {
        'char': '&#x454',
        desc: 'CYRILLIC SMALL LETTER UKRAINIAN IE'
      }, {
        'char': '&#x455',
        desc: 'CYRILLIC SMALL LETTER DZE'
      }, {
        'char': '&#x456',
        desc: 'CYRILLIC SMALL LETTER BYELORUSSIAN-UKRAINIAN I'
      }, {
        'char': '&#x457',
        desc: 'CYRILLIC SMALL LETTER YI'
      }, {
        'char': '&#x458',
        desc: 'CYRILLIC SMALL LETTER JE'
      }, {
        'char': '&#x459',
        desc: 'CYRILLIC SMALL LETTER LJE'
      }, {
        'char': '&#x45A',
        desc: 'CYRILLIC SMALL LETTER NJE'
      }, {
        'char': '&#x45B',
        desc: 'CYRILLIC SMALL LETTER TSHE'
      }, {
        'char': '&#x45C',
        desc: 'CYRILLIC SMALL LETTER KJE'
      }, {
        'char': '&#x45D',
        desc: 'CYRILLIC SMALL LETTER I WITH GRAVE'
      }, {
        'char': '&#x45E',
        desc: 'CYRILLIC SMALL LETTER SHORT U'
      }, {
        'char': '&#x45F',
        desc: 'CYRILLIC SMALL LETTER DZHE'
      }]
    }, {
      title: 'Punctuation',
      "char": '&ndash;',
      list: [{
        'char': '&ndash;',
        desc: 'EN DASH'
      }, {
        'char': '&mdash;',
        desc: 'EM DASH'
      }, {
        'char': '&lsquo;',
        desc: 'LEFT SINGLE QUOTATION MARK'
      }, {
        'char': '&rsquo;',
        desc: 'RIGHT SINGLE QUOTATION MARK'
      }, {
        'char': '&sbquo;',
        desc: 'SINGLE LOW-9 QUOTATION MARK'
      }, {
        'char': '&ldquo;',
        desc: 'LEFT DOUBLE QUOTATION MARK'
      }, {
        'char': '&rdquo;',
        desc: 'RIGHT DOUBLE QUOTATION MARK'
      }, {
        'char': '&bdquo;',
        desc: 'DOUBLE LOW-9 QUOTATION MARK'
      }, {
        'char': '&dagger;',
        desc: 'DAGGER'
      }, {
        'char': '&Dagger;',
        desc: 'DOUBLE DAGGER'
      }, {
        'char': '&bull;',
        desc: 'BULLET'
      }, {
        'char': '&hellip;',
        desc: 'HORIZONTAL ELLIPSIS'
      }, {
        'char': '&permil;',
        desc: 'PER MILLE SIGN'
      }, {
        'char': '&prime;',
        desc: 'PRIME'
      }, {
        'char': '&Prime;',
        desc: 'DOUBLE PRIME'
      }, {
        'char': '&lsaquo;',
        desc: 'SINGLE LEFT-POINTING ANGLE QUOTATION MARK'
      }, {
        'char': '&rsaquo;',
        desc: 'SINGLE RIGHT-POINTING ANGLE QUOTATION MARK'
      }, {
        'char': '&oline;',
        desc: 'OVERLINE'
      }, {
        'char': '&frasl;',
        desc: 'FRACTION SLASH'
      }]
    }, {
      title: 'Currency',
      "char": '&#x20A0',
      list: [{
        'char': '&#x20A0',
        desc: 'EURO-CURRENCY SIGN'
      }, {
        'char': '&#x20A1',
        desc: 'COLON SIGN'
      }, {
        'char': '&#x20A2',
        desc: 'CRUZEIRO SIGN'
      }, {
        'char': '&#x20A3',
        desc: 'FRENCH FRANC SIGN'
      }, {
        'char': '&#x20A4',
        desc: 'LIRA SIGN'
      }, {
        'char': '&#x20A5',
        desc: 'MILL SIGN'
      }, {
        'char': '&#x20A6',
        desc: 'NAIRA SIGN'
      }, {
        'char': '&#x20A7',
        desc: 'PESETA SIGN'
      }, {
        'char': '&#x20A8',
        desc: 'RUPEE SIGN'
      }, {
        'char': '&#x20A9',
        desc: 'WON SIGN'
      }, {
        'char': '&#x20AA',
        desc: 'NEW SHEQEL SIGN'
      }, {
        'char': '&#x20AB',
        desc: 'DONG SIGN'
      }, {
        'char': '&#x20AC',
        desc: 'EURO SIGN'
      }, {
        'char': '&#x20AD',
        desc: 'KIP SIGN'
      }, {
        'char': '&#x20AE',
        desc: 'TUGRIK SIGN'
      }, {
        'char': '&#x20AF',
        desc: 'DRACHMA SIGN'
      }, {
        'char': '&#x20B0',
        desc: 'GERMAN PENNY SYMBOL'
      }, {
        'char': '&#x20B1',
        desc: 'PESO SIGN'
      }, {
        'char': '&#x20B2',
        desc: 'GUARANI SIGN'
      }, {
        'char': '&#x20B3',
        desc: 'AUSTRAL SIGN'
      }, {
        'char': '&#x20B4',
        desc: 'HRYVNIA SIGN'
      }, {
        'char': '&#x20B5',
        desc: 'CEDI SIGN'
      }, {
        'char': '&#x20B6',
        desc: 'LIVRE TOURNOIS SIGN'
      }, {
        'char': '&#x20B7',
        desc: 'SPESMILO SIGN'
      }, {
        'char': '&#x20B8',
        desc: 'TENGE SIGN'
      }, {
        'char': '&#x20B9',
        desc: 'INDIAN RUPEE SIGN'
      }]
    }, {
      title: 'Arrows',
      "char": '&#x2190',
      list: [{
        'char': '&#x2190',
        desc: 'LEFTWARDS ARROW'
      }, {
        'char': '&#x2191',
        desc: 'UPWARDS ARROW'
      }, {
        'char': '&#x2192',
        desc: 'RIGHTWARDS ARROW'
      }, {
        'char': '&#x2193',
        desc: 'DOWNWARDS ARROW'
      }, {
        'char': '&#x2194',
        desc: 'LEFT RIGHT ARROW'
      }, {
        'char': '&#x2195',
        desc: 'UP DOWN ARROW'
      }, {
        'char': '&#x2196',
        desc: 'NORTH WEST ARROW'
      }, {
        'char': '&#x2197',
        desc: 'NORTH EAST ARROW'
      }, {
        'char': '&#x2198',
        desc: 'SOUTH EAST ARROW'
      }, {
        'char': '&#x2199',
        desc: 'SOUTH WEST ARROW'
      }, {
        'char': '&#x219A',
        desc: 'LEFTWARDS ARROW WITH STROKE'
      }, {
        'char': '&#x219B',
        desc: 'RIGHTWARDS ARROW WITH STROKE'
      }, {
        'char': '&#x219C',
        desc: 'LEFTWARDS WAVE ARROW'
      }, {
        'char': '&#x219D',
        desc: 'RIGHTWARDS WAVE ARROW'
      }, {
        'char': '&#x219E',
        desc: 'LEFTWARDS TWO HEADED ARROW'
      }, {
        'char': '&#x219F',
        desc: 'UPWARDS TWO HEADED ARROW'
      }, {
        'char': '&#x21A0',
        desc: 'RIGHTWARDS TWO HEADED ARROW'
      }, {
        'char': '&#x21A1',
        desc: 'DOWNWARDS TWO HEADED ARROW'
      }, {
        'char': '&#x21A2',
        desc: 'LEFTWARDS ARROW WITH TAIL'
      }, {
        'char': '&#x21A3',
        desc: 'RIGHTWARDS ARROW WITH TAIL'
      }, {
        'char': '&#x21A4',
        desc: 'LEFTWARDS ARROW FROM BAR'
      }, {
        'char': '&#x21A5',
        desc: 'UPWARDS ARROW FROM BAR'
      }, {
        'char': '&#x21A6',
        desc: 'RIGHTWARDS ARROW FROM BAR'
      }, {
        'char': '&#x21A7',
        desc: 'DOWNWARDS ARROW FROM BAR'
      }, {
        'char': '&#x21A8',
        desc: 'UP DOWN ARROW WITH BASE'
      }, {
        'char': '&#x21A9',
        desc: 'LEFTWARDS ARROW WITH HOOK'
      }, {
        'char': '&#x21AA',
        desc: 'RIGHTWARDS ARROW WITH HOOK'
      }, {
        'char': '&#x21AB',
        desc: 'LEFTWARDS ARROW WITH LOOP'
      }, {
        'char': '&#x21AC',
        desc: 'RIGHTWARDS ARROW WITH LOOP'
      }, {
        'char': '&#x21AD',
        desc: 'LEFT RIGHT WAVE ARROW'
      }, {
        'char': '&#x21AE',
        desc: 'LEFT RIGHT ARROW WITH STROKE'
      }, {
        'char': '&#x21AF',
        desc: 'DOWNWARDS ZIGZAG ARROW'
      }, {
        'char': '&#x21B0',
        desc: 'UPWARDS ARROW WITH TIP LEFTWARDS'
      }, {
        'char': '&#x21B1',
        desc: 'UPWARDS ARROW WITH TIP RIGHTWARDS'
      }, {
        'char': '&#x21B2',
        desc: 'DOWNWARDS ARROW WITH TIP LEFTWARDS'
      }, {
        'char': '&#x21B3',
        desc: 'DOWNWARDS ARROW WITH TIP RIGHTWARDS'
      }, {
        'char': '&#x21B4',
        desc: 'RIGHTWARDS ARROW WITH CORNER DOWNWARDS'
      }, {
        'char': '&#x21B5',
        desc: 'DOWNWARDS ARROW WITH CORNER LEFTWARDS'
      }, {
        'char': '&#x21B6',
        desc: 'ANTICLOCKWISE TOP SEMICIRCLE ARROW'
      }, {
        'char': '&#x21B7',
        desc: 'CLOCKWISE TOP SEMICIRCLE ARROW'
      }, {
        'char': '&#x21B8',
        desc: 'NORTH WEST ARROW TO LONG BAR'
      }, {
        'char': '&#x21B9',
        desc: 'LEFTWARDS ARROW TO BAR OVER RIGHTWARDS ARROW TO BAR'
      }, {
        'char': '&#x21BA',
        desc: 'ANTICLOCKWISE OPEN CIRCLE ARROW'
      }, {
        'char': '&#x21BB',
        desc: 'CLOCKWISE OPEN CIRCLE ARROW'
      }, {
        'char': '&#x21BC',
        desc: 'LEFTWARDS HARPOON WITH BARB UPWARDS'
      }, {
        'char': '&#x21BD',
        desc: 'LEFTWARDS HARPOON WITH BARB DOWNWARDS'
      }, {
        'char': '&#x21BE',
        desc: 'UPWARDS HARPOON WITH BARB RIGHTWARDS'
      }, {
        'char': '&#x21BF',
        desc: 'UPWARDS HARPOON WITH BARB LEFTWARDS'
      }, {
        'char': '&#x21C0',
        desc: 'RIGHTWARDS HARPOON WITH BARB UPWARDS'
      }, {
        'char': '&#x21C1',
        desc: 'RIGHTWARDS HARPOON WITH BARB DOWNWARDS'
      }, {
        'char': '&#x21C2',
        desc: 'DOWNWARDS HARPOON WITH BARB RIGHTWARDS'
      }, {
        'char': '&#x21C3',
        desc: 'DOWNWARDS HARPOON WITH BARB LEFTWARDS'
      }, {
        'char': '&#x21C4',
        desc: 'RIGHTWARDS ARROW OVER LEFTWARDS ARROW'
      }, {
        'char': '&#x21C5',
        desc: 'UPWARDS ARROW LEFTWARDS OF DOWNWARDS ARROW'
      }, {
        'char': '&#x21C6',
        desc: 'LEFTWARDS ARROW OVER RIGHTWARDS ARROW'
      }, {
        'char': '&#x21C7',
        desc: 'LEFTWARDS PAIRED ARROWS'
      }, {
        'char': '&#x21C8',
        desc: 'UPWARDS PAIRED ARROWS'
      }, {
        'char': '&#x21C9',
        desc: 'RIGHTWARDS PAIRED ARROWS'
      }, {
        'char': '&#x21CA',
        desc: 'DOWNWARDS PAIRED ARROWS'
      }, {
        'char': '&#x21CB',
        desc: 'LEFTWARDS HARPOON OVER RIGHTWARDS HARPOON'
      }, {
        'char': '&#x21CC',
        desc: 'RIGHTWARDS HARPOON OVER LEFTWARDS HARPOON'
      }, {
        'char': '&#x21CD',
        desc: 'LEFTWARDS DOUBLE ARROW WITH STROKE'
      }, {
        'char': '&#x21CE',
        desc: 'LEFT RIGHT DOUBLE ARROW WITH STROKE'
      }, {
        'char': '&#x21CF',
        desc: 'RIGHTWARDS DOUBLE ARROW WITH STROKE'
      }, {
        'char': '&#x21D0',
        desc: 'LEFTWARDS DOUBLE ARROW'
      }, {
        'char': '&#x21D1',
        desc: 'UPWARDS DOUBLE ARROW'
      }, {
        'char': '&#x21D2',
        desc: 'RIGHTWARDS DOUBLE ARROW'
      }, {
        'char': '&#x21D3',
        desc: 'DOWNWARDS DOUBLE ARROW'
      }, {
        'char': '&#x21D4',
        desc: 'LEFT RIGHT DOUBLE ARROW'
      }, {
        'char': '&#x21D5',
        desc: 'UP DOWN DOUBLE ARROW'
      }, {
        'char': '&#x21D6',
        desc: 'NORTH WEST DOUBLE ARROW'
      }, {
        'char': '&#x21D7',
        desc: 'NORTH EAST DOUBLE ARROW'
      }, {
        'char': '&#x21D8',
        desc: 'SOUTH EAST DOUBLE ARROW'
      }, {
        'char': '&#x21D9',
        desc: 'SOUTH WEST DOUBLE ARROW'
      }, {
        'char': '&#x21DA',
        desc: 'LEFTWARDS TRIPLE ARROW'
      }, {
        'char': '&#x21DB',
        desc: 'RIGHTWARDS TRIPLE ARROW'
      }, {
        'char': '&#x21DC',
        desc: 'LEFTWARDS SQUIGGLE ARROW'
      }, {
        'char': '&#x21DD',
        desc: 'RIGHTWARDS SQUIGGLE ARROW'
      }, {
        'char': '&#x21DE',
        desc: 'UPWARDS ARROW WITH DOUBLE STROKE'
      }, {
        'char': '&#x21DF',
        desc: 'DOWNWARDS ARROW WITH DOUBLE STROKE'
      }, {
        'char': '&#x21E0',
        desc: 'LEFTWARDS DASHED ARROW'
      }, {
        'char': '&#x21E1',
        desc: 'UPWARDS DASHED ARROW'
      }, {
        'char': '&#x21E2',
        desc: 'RIGHTWARDS DASHED ARROW'
      }, {
        'char': '&#x21E3',
        desc: 'DOWNWARDS DASHED ARROW'
      }, {
        'char': '&#x21E4',
        desc: 'LEFTWARDS ARROW TO BAR'
      }, {
        'char': '&#x21E5',
        desc: 'RIGHTWARDS ARROW TO BAR'
      }, {
        'char': '&#x21E6',
        desc: 'LEFTWARDS WHITE ARROW'
      }, {
        'char': '&#x21E7',
        desc: 'UPWARDS WHITE ARROW'
      }, {
        'char': '&#x21E8',
        desc: 'RIGHTWARDS WHITE ARROW'
      }, {
        'char': '&#x21E9',
        desc: 'DOWNWARDS WHITE ARROW'
      }, {
        'char': '&#x21EA',
        desc: 'UPWARDS WHITE ARROW FROM BAR'
      }, {
        'char': '&#x21EB',
        desc: 'UPWARDS WHITE ARROW ON PEDESTAL'
      }, {
        'char': '&#x21EC',
        desc: 'UPWARDS WHITE ARROW ON PEDESTAL WITH HORIZONTAL BAR'
      }, {
        'char': '&#x21ED',
        desc: 'UPWARDS WHITE ARROW ON PEDESTAL WITH VERTICAL BAR'
      }, {
        'char': '&#x21EE',
        desc: 'UPWARDS WHITE DOUBLE ARROW'
      }, {
        'char': '&#x21EF',
        desc: 'UPWARDS WHITE DOUBLE ARROW ON PEDESTAL'
      }, {
        'char': '&#x21F0',
        desc: 'RIGHTWARDS WHITE ARROW FROM WALL'
      }, {
        'char': '&#x21F1',
        desc: 'NORTH WEST ARROW TO CORNER'
      }, {
        'char': '&#x21F2',
        desc: 'SOUTH EAST ARROW TO CORNER'
      }, {
        'char': '&#x21F3',
        desc: 'UP DOWN WHITE ARROW'
      }, {
        'char': '&#x21F4',
        desc: 'RIGHT ARROW WITH SMALL CIRCLE'
      }, {
        'char': '&#x21F5',
        desc: 'DOWNWARDS ARROW LEFTWARDS OF UPWARDS ARROW'
      }, {
        'char': '&#x21F6',
        desc: 'THREE RIGHTWARDS ARROWS'
      }, {
        'char': '&#x21F7',
        desc: 'LEFTWARDS ARROW WITH VERTICAL STROKE'
      }, {
        'char': '&#x21F8',
        desc: 'RIGHTWARDS ARROW WITH VERTICAL STROKE'
      }, {
        'char': '&#x21F9',
        desc: 'LEFT RIGHT ARROW WITH VERTICAL STROKE'
      }, {
        'char': '&#x21FA',
        desc: 'LEFTWARDS ARROW WITH DOUBLE VERTICAL STROKE'
      }, {
        'char': '&#x21FB',
        desc: 'RIGHTWARDS ARROW WITH DOUBLE VERTICAL STROKE'
      }, {
        'char': '&#x21FC',
        desc: 'LEFT RIGHT ARROW WITH DOUBLE VERTICAL STROKE'
      }, {
        'char': '&#x21FD',
        desc: 'LEFTWARDS OPEN-HEADED ARROW'
      }, {
        'char': '&#x21FE',
        desc: 'RIGHTWARDS OPEN-HEADED ARROW'
      }, {
        'char': '&#x21FF',
        desc: 'LEFT RIGHT OPEN-HEADED ARROW'
      }]
    }, {
      title: 'Math',
      "char": '&forall;',
      list: [{
        'char': '&forall;',
        desc: 'FOR ALL'
      }, {
        'char': '&part;',
        desc: 'PARTIAL DIFFERENTIAL'
      }, {
        'char': '&exist;',
        desc: 'THERE EXISTS'
      }, {
        'char': '&empty;',
        desc: 'EMPTY SET'
      }, {
        'char': '&nabla;',
        desc: 'NABLA'
      }, {
        'char': '&isin;',
        desc: 'ELEMENT OF'
      }, {
        'char': '&notin;',
        desc: 'NOT AN ELEMENT OF'
      }, {
        'char': '&ni;',
        desc: 'CONTAINS AS MEMBER'
      }, {
        'char': '&prod;',
        desc: 'N-ARY PRODUCT'
      }, {
        'char': '&sum;',
        desc: 'N-ARY SUMMATION'
      }, {
        'char': '&minus;',
        desc: 'MINUS SIGN'
      }, {
        'char': '&lowast;',
        desc: 'ASTERISK OPERATOR'
      }, {
        'char': '&radic;',
        desc: 'SQUARE ROOT'
      }, {
        'char': '&prop;',
        desc: 'PROPORTIONAL TO'
      }, {
        'char': '&infin;',
        desc: 'INFINITY'
      }, {
        'char': '&ang;',
        desc: 'ANGLE'
      }, {
        'char': '&and;',
        desc: 'LOGICAL AND'
      }, {
        'char': '&or;',
        desc: 'LOGICAL OR'
      }, {
        'char': '&cap;',
        desc: 'INTERSECTION'
      }, {
        'char': '&cup;',
        desc: 'UNION'
      }, {
        'char': '&int;',
        desc: 'INTEGRAL'
      }, {
        'char': '&there4;',
        desc: 'THEREFORE'
      }, {
        'char': '&sim;',
        desc: 'TILDE OPERATOR'
      }, {
        'char': '&cong;',
        desc: 'APPROXIMATELY EQUAL TO'
      }, {
        'char': '&asymp;',
        desc: 'ALMOST EQUAL TO'
      }, {
        'char': '&ne;',
        desc: 'NOT EQUAL TO'
      }, {
        'char': '&equiv;',
        desc: 'IDENTICAL TO'
      }, {
        'char': '&le;',
        desc: 'LESS-THAN OR EQUAL TO'
      }, {
        'char': '&ge;',
        desc: 'GREATER-THAN OR EQUAL TO'
      }, {
        'char': '&sub;',
        desc: 'SUBSET OF'
      }, {
        'char': '&sup;',
        desc: 'SUPERSET OF'
      }, {
        'char': '&nsub;',
        desc: 'NOT A SUBSET OF'
      }, {
        'char': '&sube;',
        desc: 'SUBSET OF OR EQUAL TO'
      }, {
        'char': '&supe;',
        desc: 'SUPERSET OF OR EQUAL TO'
      }, {
        'char': '&oplus;',
        desc: 'CIRCLED PLUS'
      }, {
        'char': '&otimes;',
        desc: 'CIRCLED TIMES'
      }, {
        'char': '&perp;',
        desc: 'UP TACK'
      }]
    }, {
      title: 'Misc',
      "char": '&spades;',
      list: [{
        'char': '&spades;',
        desc: 'BLACK SPADE SUIT'
      }, {
        'char': '&clubs;',
        desc: 'BLACK CLUB SUIT'
      }, {
        'char': '&hearts;',
        desc: 'BLACK HEART SUIT'
      }, {
        'char': '&diams;',
        desc: 'BLACK DIAMOND SUIT'
      }, {
        'char': '&#x2669',
        desc: 'QUARTER NOTE'
      }, {
        'char': '&#x266A',
        desc: 'EIGHTH NOTE'
      }, {
        'char': '&#x266B',
        desc: 'BEAMED EIGHTH NOTES'
      }, {
        'char': '&#x266C',
        desc: 'BEAMED SIXTEENTH NOTES'
      }, {
        'char': '&#x266D',
        desc: 'MUSIC FLAT SIGN'
      }, {
        'char': '&#x266E',
        desc: 'MUSIC NATURAL SIGN'
      }, {
        'char': '&#x2600',
        desc: 'BLACK SUN WITH RAYS'
      }, {
        'char': '&#x2601',
        desc: 'CLOUD'
      }, {
        'char': '&#x2602',
        desc: 'UMBRELLA'
      }, {
        'char': '&#x2603',
        desc: 'SNOWMAN'
      }, {
        'char': '&#x2615',
        desc: 'HOT BEVERAGE'
      }, {
        'char': '&#x2618',
        desc: 'SHAMROCK'
      }, {
        'char': '&#x262F',
        desc: 'YIN YANG'
      }, {
        'char': '&#x2714',
        desc: 'HEAVY CHECK MARK'
      }, {
        'char': '&#x2716',
        desc: 'HEAVY MULTIPLICATION X'
      }, {
        'char': '&#x2744',
        desc: 'SNOWFLAKE'
      }, {
        'char': '&#x275B',
        desc: 'HEAVY SINGLE TURNED COMMA QUOTATION MARK ORNAMENT'
      }, {
        'char': '&#x275C',
        desc: 'HEAVY SINGLE COMMA QUOTATION MARK ORNAMENT'
      }, {
        'char': '&#x275D',
        desc: 'HEAVY DOUBLE TURNED COMMA QUOTATION MARK ORNAMENT'
      }, {
        'char': '&#x275E',
        desc: 'HEAVY DOUBLE COMMA QUOTATION MARK ORNAMENT'
      }, {
        'char': '&#x2764',
        desc: 'HEAVY BLACK HEART'
      }]
    }],
    specialCharButtons: ['specialCharBack', '|']
  });
  Object.assign(FE.POPUP_TEMPLATES, {
    'specialCharacters': '[_BUTTONS_][_CUSTOM_LAYER_]'
  });

  FE.PLUGINS.specialCharacters = function (editor) {
    var $ = editor.$; // Load categories with special characters data

    var selectedCategory = editor.opts.specialCharactersSets[0];
    var categories = editor.opts.specialCharactersSets;
    var specialCharButtons = '';
    /** 
     * Display the special characters popup 
     */

    function _showSpecialChars() {
      var $popup = editor.popups.get('specialCharacters');
      if (!$popup) $popup = _initSpecialChars();

      if (!$popup.hasClass('fr-active')) {
        editor.popups.refresh('specialCharacters');
        editor.popups.setContainer('specialCharacters', editor.$tb); // Special characters popup left and top position.

        var $btn = editor.$tb.find('.fr-command[data-cmd="specialCharacters"]');

        var _editor$button$getPos = editor.button.getPosition($btn),
            left = _editor$button$getPos.left,
            top = _editor$button$getPos.top;

        editor.popups.show('specialCharacters', left, top, outerHeight);
      }
    }
    /** 
     * Initialize the special characters popup
     */


    function _initSpecialChars() {
      if (editor.opts.toolbarInline) {
        // If toolbar is inline then load special character buttons
        if (editor.opts.specialCharButtons.length > 0) {
          specialCharButtons = "<div class=\"fr-buttons fr-tabs\">".concat(editor.button.buildList(editor.opts.specialCharButtons), "</div>");
        }
      } // Template for popup


      var template = {
        buttons: specialCharButtons,
        custom_layer: _specialCharsHTML() // Create popup.

      };
      var $popup = editor.popups.create('specialCharacters', template);

      _addAccessibility($popup);

      return $popup;
    }
    /** 
     * HTML for the special characters popup. 
     */


    function _specialCharsHTML() {
      // Create special characters html.
      return "\n        <div class=\"fr-buttons fr-tabs fr-tabs-scroll\">\n          ".concat(_renderSplCharsCategory(categories, selectedCategory), "\n        </div>\n        <div class=\"fr-icon-container fr-sc-container\">\n          ").concat(_renderSpanSplCharsHtml(selectedCategory), "\n        </div>");
    }
    /** 
     * Refresh the Popup 
     */


    function _refreshPopup() {
      editor.popups.get('specialCharacters').html(specialCharButtons + _specialCharsHTML());
    }
    /** 
     * Set the current selected special character category and update the popup 
     */


    function setSpecialCharacterCategory(categoryId) {
      selectedCategory = categories.filter(function (category) {
        return category.title === categoryId;
      })[0];

      _refreshPopup();
    }
    /** 
     * Register keyboard events. 
     */


    function _addAccessibility($popup) {
      // Register popup event.
      editor.events.on('popup.tab', function (e) {
        var $focused_item = $(e.currentTarget); // Skip if popup is not visible or focus is elsewere.

        if (!editor.popups.isVisible('specialCharacters') || !$focused_item.is('span, a')) {
          return true;
        }

        var key_code = e.which;
        var status;
        var index;
        var $el; // Tabbing.

        if (FE.KEYCODE.TAB == key_code) {
          // Extremities reached.
          if ($focused_item.is('span.fr-icon') && e.shiftKey || $focused_item.is('a') && !e.shiftKey) {
            var $tb = $popup.find('.fr-buttons'); // Focus back the popup's toolbar if exists.

            status = !editor.accessibility.focusToolbar($tb, e.shiftKey ? true : false);
          }

          if (status !== false) {
            // Build elements that should be focused next.
            var $tabElements = $popup.find('span.fr-icon:focus').first().concat($popup.findVisible(' span.fr-icon').first().concat($popup.find('a')));

            if ($focused_item.is('span.fr-icon')) {
              $tabElements = $tabElements.not('span.fr-icon:not(:focus)');
            } // Get focused item position.


            index = $tabElements.index($focused_item); // Backwards.

            if (e.shiftKey) {
              index = ((index - 1) % $tabElements.length + $tabElements.length) % $tabElements.length; // Javascript negative modulo bug.
              // Forward.
            } else {
              index = (index + 1) % $tabElements.length;
            } // Find next element to focus.


            $el = $tabElements.get(index);
            editor.events.disableBlur();
            $el.focus();
            status = false;
          }
        } // Arrows.
        else if (FE.KEYCODE.ARROW_UP == key_code || FE.KEYCODE.ARROW_DOWN == key_code || FE.KEYCODE.ARROW_LEFT == key_code || FE.KEYCODE.ARROW_RIGHT == key_code) {
            if ($focused_item.is('span.fr-icon')) {
              // Get all current icons.
              var $icons = $focused_item.parent().find('span.fr-icon'); // Get focused item position.

              index = $icons.index($focused_item); // Get icons matrix dimensions.

              var columns = 11;
              var lines = Math.floor($icons.length / columns); // Get focused item coordinates.

              var column = index % columns;
              var line = Math.floor(index / columns);
              var nextIndex = line * columns + column;
              var dimension = lines * columns; // Calculate next index. Go to the other opposite site of the matrix if there is no next adjacent element.
              // Up/Down: Traverse matrix lines.
              // Left/Right: Traverse the matrix as it is a vector.

              if (FE.KEYCODE.ARROW_UP == key_code) {
                nextIndex = ((nextIndex - columns) % dimension + dimension) % dimension; // Javascript negative modulo bug.
              } else if (FE.KEYCODE.ARROW_DOWN == key_code) {
                nextIndex = (nextIndex + columns) % dimension;
              } else if (FE.KEYCODE.ARROW_LEFT == key_code) {
                nextIndex = ((nextIndex - 1) % dimension + dimension) % dimension; // Javascript negative modulo bug.
              } else if (FE.KEYCODE.ARROW_RIGHT == key_code) {
                nextIndex = (nextIndex + 1) % dimension;
              } // Get the next element based on the new index.


              $el = $($icons.get(nextIndex)); // Focus.

              editor.events.disableBlur();
              $el.focus();
              status = false;
            }
          } // ENTER or SPACE.
          else if (FE.KEYCODE.ENTER == key_code) {
              if ($focused_item.is('a')) {
                $focused_item[0].click();
              } else {
                editor.button.exec($focused_item);
              }

              status = false;
            } // Prevent propagation.


        if (status === false) {
          e.preventDefault();
          e.stopPropagation();
        }

        return status;
      }, true);
    }
    /**
     * Render special characters category and update the popup
     */


    function _renderSplCharsCategory(categories, selectedCategory) {
      var buttonHtml = '';
      categories.forEach(function (category) {
        var buttonMap = {
          elementClass: category.title === selectedCategory.title ? 'fr-active fr-active-tab' : '',
          title: category.title,
          dataParam1: category.title,
          desc: category["char"]
        };
        buttonHtml += "<button class=\"fr-command fr-btn fr-special-character-category ".concat(buttonMap.elementClass, "\" title=\"").concat(buttonMap.title, "\" data-cmd=\"setSpecialCharacterCategory\" data-param1=\"").concat(buttonMap.dataParam1, "\"><span>").concat(buttonMap.desc, "</span></button>");
      });
      return buttonHtml;
    }
    /**
     * Render special character
     */


    function _renderSpanSplCharsHtml(selectedCategory) {
      var splChars_html = '';
      selectedCategory.list.forEach(function (splChar) {
        var splCharMap = {
          dataParam1: splChar["char"],
          title: splChar.desc,
          splCharValue: splChar["char"]
        };
        splChars_html += "<span class=\"fr-command fr-special-character fr-icon\" role=\"button\" \n      data-cmd=\"insertSpecialCharacter\" data-param1=\"".concat(splCharMap.dataParam1, "\" \n      title=\"").concat(splCharMap.title, "\">").concat(splCharMap.splCharValue, "</span>");
      });
      return splChars_html;
    }
    /*
     * Go back to the inline editor.
    */


    function back() {
      editor.popups.hide('specialCharacters');
      editor.toolbar.showInline();
    }

    return {
      setSpecialCharacterCategory: setSpecialCharacterCategory,
      showSpecialCharsPopup: _showSpecialChars,
      back: back
    };
  };

  FE.DefineIcon('specialCharacters', {
    NAME: 'dollar-sign',
    SVG_KEY: 'symbols'
  });
  FE.RegisterCommand('specialCharacters', {
    title: 'Special Characters',
    icon: 'specialCharacters',
    undo: false,
    focus: false,
    popup: true,
    refreshAfterCallback: false,
    plugin: 'specialCharacters',
    showOnMobile: true,
    callback: function callback() {
      if (!this.popups.isVisible('specialCharacters')) {
        this.specialCharacters.showSpecialCharsPopup();
      } else {
        if (this.$el.find('.fr-marker')) {
          this.events.disableBlur();
          this.selection.restore();
        }

        this.popups.hide('specialCharacters');
      }
    }
  });
  FE.RegisterCommand('insertSpecialCharacter', {
    callback: function callback(cmd, specialCharacter) {
      // Insert special characters
      this.undo.saveStep();
      this.html.insert(specialCharacter);
      this.undo.saveStep();
      this.popups.hide('specialCharacters');
    }
  });
  FE.RegisterCommand('setSpecialCharacterCategory', {
    undo: false,
    focus: false,
    callback: function callback(cmd, category) {
      this.specialCharacters.setSpecialCharacterCategory(category);
    }
  });
  FE.DefineIcon('specialCharBack', {
    NAME: 'arrow-left',
    SVG_KEY: 'back'
  });
  FE.RegisterCommand('specialCharBack', {
    title: 'Back',
    undo: false,
    focus: false,
    back: true,
    refreshAfterCallback: false,
    callback: function callback() {
      this.specialCharacters.back();
    }
  });

  Object.assign(FE.POPUP_TEMPLATES, {
    'table.insert': '[_BUTTONS_][_ROWS_COLUMNS_]',
    'table.edit': '[_BUTTONS_]',
    'table.colors': '[_BUTTONS_][_COLORS_][_CUSTOM_COLOR_]'
  }); // Extend defaults.

  Object.assign(FE.DEFAULTS, {
    tableInsertMaxSize: 10,
    tableEditButtons: ['tableHeader', 'tableRemove', 'tableRows', 'tableColumns', 'tableStyle', '-', 'tableCells', 'tableCellBackground', 'tableCellVerticalAlign', 'tableCellHorizontalAlign', 'tableCellStyle'],
    tableInsertButtons: ['tableBack', '|'],
    tableResizer: true,
    tableDefaultWidth: '100%',
    tableResizerOffset: 5,
    tableResizingLimit: 30,
    tableColorsButtons: ['tableBack', '|'],
    tableColors: ['#61BD6D', '#1ABC9C', '#54ACD2', '#2C82C9', '#9365B8', '#475577', '#CCCCCC', '#41A85F', '#00A885', '#3D8EB9', '#2969B0', '#553982', '#28324E', '#000000', '#F7DA64', '#FBA026', '#EB6B56', '#E25041', '#A38F84', '#EFEFEF', '#FFFFFF', '#FAC51C', '#F37934', '#D14841', '#B8312F', '#7C706B', '#D1D5D8', 'REMOVE'],
    tableColorsStep: 7,
    tableCellStyles: {
      'fr-highlighted': 'Highlighted',
      'fr-thick': 'Thick'
    },
    tableStyles: {
      'fr-dashed-borders': 'Dashed Borders',
      'fr-alternate-rows': 'Alternate Rows'
    },
    tableCellMultipleStyles: true,
    tableMultipleStyles: true,
    tableInsertHelper: true,
    tableInsertHelperOffset: 15
  });

  FE.PLUGINS.table = function (editor) {
    var $ = editor.$;
    var $resizer;
    var $insert_helper;
    var mouseDownCellFlag;
    var mouseDownFlag;
    var mouseDownCell;
    var mouseMoveTimer;
    var resizingFlag;
    /*
     * Show the insert table popup.
     */

    function _showInsertPopup() {
      var $btn = editor.$tb.find('.fr-command[data-cmd="insertTable"]');
      var $popup = editor.popups.get('table.insert');
      if (!$popup) $popup = _initInsertPopup();

      if (!$popup.hasClass('fr-active')) {
        // Insert table popup
        editor.popups.refresh('table.insert');
        editor.popups.setContainer('table.insert', editor.$tb); // Insert table left and top position.

        var _editor$button$getPos = editor.button.getPosition($btn),
            left = _editor$button$getPos.left,
            top = _editor$button$getPos.top;

        editor.popups.show('table.insert', left, top, $btn.outerHeight());
      }
    }
    /*
     * Show the table edit popup.
     */


    function _showEditPopup() {
      // Set popup position.
      var map = _tableMap();

      if (map) {
        var $popup = editor.popups.get('table.edit');
        if (!$popup) $popup = _initEditPopup();

        if ($popup) {
          editor.popups.setContainer('table.edit', editor.$sc);

          var offset = _selectionOffset(map);

          var left = offset.left + (offset.right - offset.left) / 2;
          var top = offset.bottom;
          editor.popups.show('table.edit', left, top, offset.bottom - offset.top, true); // Disable toolbar buttons only if there are more than one cells selected.

          if (editor.edit.isDisabled()) {
            // Disable toolbar.
            if (selectedCells().length > 1) {
              editor.toolbar.disable();
            } // Allow text selection.


            editor.$el.removeClass('fr-no-selection');
            editor.edit.on();
            editor.button.bulkRefresh(); // https://github.com/froala/wysiwyg-editor/issues/1851.
            // https://github.com/froala-labs/froala-editor-js-2/issues/314.
            // https://github.com/froala/wysiwyg-editor/issues/1656.
            // https://github.com/froala-labs/froala-editor-js-2/issues/294.
            // Place selection in last selected table cell.

            editor.selection.setAtEnd(editor.$el.find('.fr-selected-cell').last().get(0));
            editor.selection.restore();
          }
        }
      }
    }
    /*
     * Show the table colors popup.
     */


    function _showColorsPopup() {
      // Set popup position.
      var map = _tableMap();

      if (map) {
        var $popup = editor.popups.get('table.colors');
        if (!$popup) $popup = _initColorsPopup();
        editor.popups.setContainer('table.colors', editor.$sc);

        var offset = _selectionOffset(map);

        var left = (offset.left + offset.right) / 2;
        var top = offset.bottom; // Refresh selected color.

        _refreshColor();

        editor.popups.show('table.colors', left, top, offset.bottom - offset.top, true);
      }
    }
    /*
     * Called on table edit popup hide.
     */


    function _hideEditPopup() {
      // Enable toolbar.
      if (selectedCells().length === 0) {
        editor.toolbar.enable();
      }
    }
    /**
     * Init the insert table popup.
     */


    function _initInsertPopup(delayed) {
      if (delayed) {
        editor.popups.onHide('table.insert', function () {
          // Clear previous cell selection.
          editor.popups.get('table.insert').find('.fr-table-size .fr-select-table-size > span[data-row="1"][data-col="1"]').trigger('mouseover');
        });
        return true;
      } // Table buttons.


      var table_buttons = '';

      if (editor.opts.tableInsertButtons.length > 0) {
        table_buttons = '<div class="fr-buttons fr-tabs">' + editor.button.buildList(editor.opts.tableInsertButtons) + '</div>';
      }

      var template = {
        buttons: table_buttons,
        rows_columns: _insertTableHtml()
      };
      var $popup = editor.popups.create('table.insert', template); // Initialize insert table grid events.

      editor.events.$on($popup, 'mouseover', '.fr-table-size .fr-select-table-size .fr-table-cell', function (e) {
        _hoverCell($(e.currentTarget));
      }, true);

      _addAccessibility($popup);

      return $popup;
    }
    /*
     * Hover table cell.
     */


    function _hoverCell($table_cell) {
      var row = $table_cell.data('row');

      if (row !== null) {
        row = parseInt(row);
      }

      var col = $table_cell.data('col');

      if (col !== null) {
        col = parseInt(col);
      }

      var $select_size = $table_cell.parent(); // Update size in title.

      $select_size.siblings('.fr-table-size-info').html(row + ' &times; ' + col); // Remove hover and fr-active-item class from all cells.

      $select_size.find('> span').removeClass('hover fr-active-item'); // Add hover class only to the correct cells.

      for (var i = 1; i <= editor.opts.tableInsertMaxSize; i++) {
        for (var j = 0; j <= editor.opts.tableInsertMaxSize; j++) {
          var $cell = $select_size.find('> span[data-row="' + i + '"][data-col="' + j + '"]');

          if (i <= row && j <= col) {
            $cell.addClass('hover');
          } else if (i <= row + 1 || i <= 2 && !editor.helpers.isMobile()) {
            $cell.css('display', 'inline-block');
          } else if (i > 2 && !editor.helpers.isMobile()) {
            $cell.css('display', 'none');
          }
        }
      } // Mark table cell as the active item.


      $table_cell.addClass('fr-active-item');
    }
    /*
     * The HTML for insert table grid.
     */


    function _insertTableHtml() {
      // Grid html
      var rows_columns = '<div class="fr-table-size"><div class="fr-table-size-info">1 &times; 1</div><div class="fr-select-table-size">';

      for (var i = 1; i <= editor.opts.tableInsertMaxSize; i++) {
        for (var j = 1; j <= editor.opts.tableInsertMaxSize; j++) {
          var display = 'inline-block'; // Display only first 2 rows.

          if (i > 2 && !editor.helpers.isMobile()) {
            display = 'none';
          }

          var cls = 'fr-table-cell ';

          if (i == 1 && j == 1) {
            cls += ' hover';
          }

          rows_columns += '<span class="fr-command ' + cls + '" tabIndex="-1" data-cmd="tableInsert" data-row="' + i + '" data-col="' + j + '" data-param1="' + i + '" data-param2="' + j + '" style="display: ' + display + ';" role="button"><span></span><span class="fr-sr-only">' + i + ' &times; ' + j + '&nbsp;&nbsp;&nbsp;</span></span>';
        }

        rows_columns += '<div class="new-line"></div>';
      }

      rows_columns += '</div></div>';
      return rows_columns;
    }
    /*
     * Register keyboard events.
     */


    function _addAccessibility($popup) {
      // Hover cell when table.insert cells are focused.
      editor.events.$on($popup, 'focus', '[tabIndex]', function (e) {
        var $focused_el = $(e.currentTarget);

        _hoverCell($focused_el);
      }); // Register popup event.

      editor.events.on('popup.tab', function (e) {
        var $focused_item = $(e.currentTarget); // Skip if popup is not visible or focus is elsewere.

        if (!editor.popups.isVisible('table.insert') || !$focused_item.is('span, a')) {
          return true;
        }

        var key_code = e.which;
        var status;

        if (FE.KEYCODE.ARROW_UP == key_code || FE.KEYCODE.ARROW_DOWN == key_code || FE.KEYCODE.ARROW_LEFT == key_code || FE.KEYCODE.ARROW_RIGHT == key_code) {
          if ($focused_item.is('span.fr-table-cell')) {
            // Get all current cells.
            var $cells = $focused_item.parent().find('span.fr-table-cell'); // Get focused item position.

            var index = $cells.index($focused_item); // Get cell matrix dimensions.

            var columns = editor.opts.tableInsertMaxSize; // Get focused item coordinates.

            var column = index % columns;
            var line = Math.floor(index / columns); // Calculate next coordinates. Go to the other opposite site of the matrix if there is no next adjacent element.

            if (FE.KEYCODE.ARROW_UP == key_code) {
              line = Math.max(0, line - 1);
            } else if (FE.KEYCODE.ARROW_DOWN == key_code) {
              line = Math.min(editor.opts.tableInsertMaxSize - 1, line + 1);
            } else if (FE.KEYCODE.ARROW_LEFT == key_code) {
              column = Math.max(0, column - 1);
            } else if (FE.KEYCODE.ARROW_RIGHT == key_code) {
              column = Math.min(editor.opts.tableInsertMaxSize - 1, column + 1);
            } // Get the next element based on the new coordinates.


            var nextIndex = line * columns + column;
            var $el = $($cells.get(nextIndex)); // Hover cell

            _hoverCell($el); // Focus.


            editor.events.disableBlur();
            $el.focus();
            status = false;
          }
        } // ENTER or SPACE.
        else if (FE.KEYCODE.ENTER == key_code) {
            editor.button.exec($focused_item);
            status = false;
          } // Prevent propagation.


        if (status === false) {
          e.preventDefault();
          e.stopPropagation();
        }

        return status;
      }, true);
    }
    /**
     * Init the table edit popup.
     */


    function _initEditPopup(delayed) {
      if (delayed) {
        editor.popups.onHide('table.edit', _hideEditPopup);
        return true;
      } // Table buttons.


      var table_buttons = '';

      if (editor.opts.tableEditButtons.length > 0) {
        table_buttons = "<div class=\"fr-buttons\">".concat(editor.button.buildList(editor.opts.tableEditButtons), "</div>");
        var template = {
          buttons: table_buttons
        };
        var $popup = editor.popups.create('table.edit', template);
        editor.events.$on(editor.$wp, 'scroll.table-edit', function () {
          if (editor.popups.isVisible('table.edit')) {
            _showEditPopup();
          }
        });
        return $popup;
      }

      return false;
    }
    /*
     * Init the table cell background popup.
     */


    function _initColorsPopup() {
      // Table colors buttons.
      var table_buttons = '';

      if (editor.opts.tableColorsButtons.length > 0) {
        table_buttons = '<div class="fr-buttons fr-tabs">' + editor.button.buildList(editor.opts.tableColorsButtons) + '</div>';
      } // Custom HEX.


      var custom_color = '';

      if (editor.opts.colorsHEXInput) {
        custom_color = '<div class="fr-color-hex-layer fr-table-colors-hex-layer fr-active fr-layer" id="fr-table-colors-hex-layer-' + editor.id + '"><div class="fr-input-line"><input maxlength="7" id="fr-table-colors-hex-layer-text-' + editor.id + '" type="text" placeholder="' + editor.language.translate('HEX Color') + '" tabIndex="1" aria-required="true"></div><div class="fr-action-buttons"><button type="button" class="fr-command fr-submit" data-cmd="tableCellBackgroundCustomColor" tabIndex="2" role="button">' + editor.language.translate('OK') + '</button></div></div>';
      }

      var template = {
        buttons: table_buttons,
        colors: _colorsHTML(),
        custom_color: custom_color
      };
      var $popup = editor.popups.create('table.colors', template);
      editor.events.$on(editor.$wp, 'scroll.table-colors', function () {
        if (editor.popups.isVisible('table.colors')) {
          _showColorsPopup();
        }
      });

      _addColorsAccessibility($popup);

      return $popup;
    }
    /*
     * HTML for the table colors.
     */


    function _colorsHTML() {
      // Create colors html.
      var colors_html = '<div class="fr-color-set fr-table-colors">'; // Add colors.

      for (var i = 0; i < editor.opts.tableColors.length; i++) {
        if (i !== 0 && i % editor.opts.tableColorsStep === 0) {
          colors_html += '<br>';
        }

        if (editor.opts.tableColors[i] != 'REMOVE') {
          colors_html += '<span class="fr-command" style="background: ' + editor.opts.tableColors[i] + ';" tabIndex="-1" role="button" data-cmd="tableCellBackgroundColor" data-param1="' + editor.opts.tableColors[i] + '"><span class="fr-sr-only">' + editor.language.translate('Color') + ' ' + editor.opts.tableColors[i] + '&nbsp;&nbsp;&nbsp;</span></span>';
        } else {
          colors_html += '<span class="fr-command" data-cmd="tableCellBackgroundColor" tabIndex="-1" role="button" data-param1="REMOVE" title="' + editor.language.translate('Clear Formatting') + '">' + editor.icon.create('tableColorRemove') + '<span class="fr-sr-only">' + editor.language.translate('Clear Formatting') + '</span></span>';
        }
      }

      colors_html += '</div>';
      return colors_html;
    }
    /*
     * Set custom color
     */


    function customColor() {
      var $popup = editor.popups.get('table.colors');
      var $input = $popup.find('.fr-table-colors-hex-layer input');

      if ($input.length) {
        setBackground($input.val());
      }
    }
    /*
     * Register keyboard events for colors.
     */


    function _addColorsAccessibility($popup) {
      // Register popup event.
      editor.events.on('popup.tab', function (e) {
        var $focused_item = $(e.currentTarget); // Skip if popup is not visible or focus is elsewere.

        if (!editor.popups.isVisible('table.colors') || !$focused_item.is('span')) {
          return true;
        }

        var key_code = e.which;
        var status = true; // Tabbing.

        if (FE.KEYCODE.TAB == key_code) {
          var $tb = $popup.find('.fr-buttons'); // Focus back the popup's toolbar if exists.

          status = !editor.accessibility.focusToolbar($tb, e.shiftKey ? true : false);
        } // Arrows.
        else if (FE.KEYCODE.ARROW_UP == key_code || FE.KEYCODE.ARROW_DOWN == key_code || FE.KEYCODE.ARROW_LEFT == key_code || FE.KEYCODE.ARROW_RIGHT == key_code) {
            // Get all current colors.
            var $colors = $focused_item.parent().find('span.fr-command'); // Get focused item position.

            var index = $colors.index($focused_item); // Get color matrix dimensions.

            var columns = editor.opts.colorsStep;
            var lines = Math.floor($colors.length / columns); // Get focused item coordinates.

            var column = index % columns;
            var line = Math.floor(index / columns);
            var nextIndex = line * columns + column;
            var dimension = lines * columns; // Calculate next index. Go to the other opposite site of the matrix if there is no next adjacent element.
            // Up/Down: Traverse matrix lines.
            // Left/Right: Traverse the matrix as it is a vector.

            if (FE.KEYCODE.ARROW_UP == key_code) {
              nextIndex = ((nextIndex - columns) % dimension + dimension) % dimension; // Javascript negative modulo bug.
            } else if (FE.KEYCODE.ARROW_DOWN == key_code) {
              nextIndex = (nextIndex + columns) % dimension;
            } else if (FE.KEYCODE.ARROW_LEFT == key_code) {
              nextIndex = ((nextIndex - 1) % dimension + dimension) % dimension; // Javascript negative modulo bug.
            } else if (FE.KEYCODE.ARROW_RIGHT == key_code) {
              nextIndex = (nextIndex + 1) % dimension;
            } // Get the next element based on the new index.


            var $el = $($colors.get(nextIndex)); // Focus.

            editor.events.disableBlur();
            $el.focus();
            status = false;
          } // ENTER or SPACE.
          else if (FE.KEYCODE.ENTER == key_code) {
              editor.button.exec($focused_item);
              status = false;
            } // Prevent propagation.


        if (status === false) {
          e.preventDefault();
          e.stopPropagation();
        }

        return status;
      }, true);
    }
    /*
     * Show the current selected color.
     */


    function _refreshColor() {
      var $popup = editor.popups.get('table.colors');
      var $cell = editor.$el.find('.fr-selected-cell').first();
      var color = editor.helpers.RGBToHex($cell.css('background-color'));
      var $input = $popup.find('.fr-table-colors-hex-layer input'); // Remove current color selection.

      $popup.find('.fr-selected-color').removeClass('fr-selected-color fr-active-item'); // Find the selected color.

      $popup.find('span[data-param1="' + color + '"]').addClass('fr-selected-color fr-active-item');
      $input.val(color).trigger('change');
    }
    /*
     * Insert table method.
     */


    function insert(rows, cols) {
      // Create table HTML.
      var table = '<table ' + (!editor.opts.tableDefaultWidth ? '' : 'style="width: ' + editor.opts.tableDefaultWidth + ';" ') + 'class="fr-inserted-table"><tbody>';
      var cell_width = 100 / cols;
      var i;
      var j;

      for (i = 0; i < rows; i++) {
        table += '<tr>';

        for (j = 0; j < cols; j++) {
          table += '<td' + (!editor.opts.tableDefaultWidth ? '' : ' style="width: ' + cell_width.toFixed(4) + '%;"') + '>';
          if (i === 0 && j === 0) table += FE.MARKERS;
          table += '<br></td>';
        }

        table += '</tr>';
      }

      table += '</tbody></table>';
      editor.html.insert(table); // Update cursor position.

      editor.selection.restore();
      var $table = editor.$el.find('.fr-inserted-table');
      $table.removeClass('fr-inserted-table');
      editor.events.trigger('table.inserted', [$table.get(0)]);
    }
    /*
     * Delete table method.
     */


    function remove() {
      if (selectedCells().length > 0) {
        var $current_table = selectedTable(); // Update cursor position.

        editor.selection.setBefore($current_table.get(0)) || editor.selection.setAfter($current_table.get(0));
        editor.selection.restore(); // Hide table edit popup.

        editor.popups.hide('table.edit'); // Delete table.

        $current_table.remove(); // Enable toolbar.

        editor.toolbar.enable();
      }
    }
    /*
     * Add table header.
     */


    function addHeader() {
      var $table = selectedTable(); // If there is a selection in the table and the table doesn't have a header already.

      if ($table.length > 0 && $table.find('th').length === 0) {
        // Create header HTML.
        var thead = '<thead><tr>';
        var i;
        var col = 0; // Get first row and count table columns.

        $table.find('tr').first().find('> td').each(function () {
          var $td = $(this);
          col += parseInt($td.attr('colspan'), 10) || 1;
        }); // Add cells.

        for (i = 0; i < col; i++) {
          thead += '<th><br></th>';
        }

        thead += '</tr></thead>';
        $table.prepend(thead); // Reposition table edit popup.

        _showEditPopup();
      }
    }
    /*
     * Remove table header.
     */


    function removeHeader() {
      var $current_table = selectedTable();
      var $table_header = $current_table.find('thead'); // Table has a header.

      if ($table_header.length > 0) {
        // If table does not have any other rows then delete table.
        if ($current_table.find('tbody tr').length === 0) {
          // Remove table.
          remove();
        } else {
          $table_header.remove(); // Reposition table edit popup if there any more selected celss.

          if (selectedCells().length > 0) {
            _showEditPopup();
          } else {
            // Hide popup.
            editor.popups.hide('table.edit'); // Update cursor position.
            //const td = $current_table.find('tbody tr:first td:first').get(0)

            var td = $current_table.find('tbody tr').first().find('td').first().get(0);

            if (td) {
              editor.selection.setAtEnd(td);
              editor.selection.restore();
            }
          }
        }
      }
    }
    /*
     * Insert row method.
     */


    function insertRow(position) {
      var $table = selectedTable(); // We have selection in a table.

      if ($table.length > 0) {
        // Cannot insert row above the table header.
        if (editor.$el.find('th.fr-selected-cell').length > 0 && position == 'above') {
          return;
        } else {
          var i;
          var ref_row;
          var $ref_row; // Create a table map.

          var map = _tableMap(); // Get selected cells from the table.


          var selection = _currentSelection(map); // Return if no selected cell


          if (selection == null) {
            return;
          } // Reference row.


          if (position == 'above') {
            ref_row = selection.min_i;
          } else {
            ref_row = selection.max_i;
          } // Create row HTML.


          var tr = '<tr>'; // Add cells.

          for (i = 0; i < map[ref_row].length; i++) {
            // If cell has rowspan we should increase it.
            if (position == 'below' && ref_row < map.length - 1 && map[ref_row][i] == map[ref_row + 1][i] || position == 'above' && ref_row > 0 && map[ref_row][i] == map[ref_row - 1][i]) {
              // Don't increase twice for colspan.
              if (i === 0 || i > 0 && map[ref_row][i] != map[ref_row][i - 1]) {
                var $cell = $(map[ref_row][i]);
                $cell.attr('rowspan', parseInt($cell.attr('rowspan'), 10) + 1);
              }
            } else {
              var $refCell = $(map[ref_row][i]);
              tr += '<td style="' + $refCell.attr('style') + '" ><br></td>';
            }
          } // Close row tag.


          tr += '</tr>'; // Current selection is in header. Should insert in table body

          if (editor.$el.find('th.fr-selected-cell').length > 0 && position == 'below') {
            $ref_row = $($table.find('tbody').not($table.find('> table tbody')));
          } // Selection is in body
          else {
              $ref_row = $($table.find('tr').not($table.find('> table tr')).get(ref_row));
            } // Insert new row.


          if (position == 'below') {
            if ($ref_row.attr('tagName') == 'TBODY') {
              $ref_row.prepend(tr);
            } else {
              if ($ref_row[0].parentNode) {
                $ref_row[0].insertAdjacentHTML('afterend', tr);
              }
            }
          } else if (position == 'above') {
            $ref_row.before(tr); // Reposition table edit popup.

            if (editor.popups.isVisible('table.edit')) {
              _showEditPopup();
            }
          }
        }
      }
    }
    /*
     * Delete row method.
     */


    function deleteRow() {
      var $table = selectedTable(); // We have selection in a table.

      if ($table.length > 0) {
        var i;
        var j;
        var $row; // Create a table map.

        var map = _tableMap(); // Get selected cells from the table.


        var selection = _currentSelection(map); // Return if no selected cell


        if (selection == null) {
          return;
        } // If all the rows are selected then delete the entire table.


        if (selection.min_i === 0 && selection.max_i == map.length - 1) {
          remove();
        } else {
          // We should delete selected rows.
          for (i = selection.max_i; i >= selection.min_i; i--) {
            // $row = $($table.find('tr').not($table.find('table tr')).get(i))
            // querySelectorAll is returning incorrect result for $table.find('table tr'), it should only return any nested table tr but it is return own tr's as well. 
            // therefore trying diff way to fetch the table's own rows
            $row = $($table.find('tr').not($table.find('> table tr')).get(i)); // Go through the table map to check for rowspan on the row to delete.

            for (j = 0; j < map[i].length; j++) {
              // Don't do this twice if we have a colspan.
              if (j === 0 || map[i][j] != map[i][j - 1]) {
                var $cell = $(map[i][j]); // We should decrease rowspan.

                if (parseInt($cell.attr('rowspan'), 10) > 1) {
                  var rowspan = parseInt($cell.attr('rowspan'), 10) - 1;

                  if (rowspan == 1) {
                    $cell.removeAttr('rowspan');
                  } else {
                    $cell.attr('rowspan', rowspan);
                  }
                } // We might need to move tds on the row below if we have a rowspan that starts here.


                if (i < map.length - 1 && map[i][j] == map[i + 1][j] && (i === 0 || map[i][j] != map[i - 1][j])) {
                  // Move td to the row below.
                  var td = map[i][j];
                  var col = j; // Go back until we get the last element (we might have colspan).

                  while (col > 0 && map[i][col] == map[i][col - 1]) {
                    col--;
                  } // Add td at the beginning of the row below.


                  if (col === 0) {
                    // $($table.find('tr').not($table.find('table tr')).get(i + 1)).prepend(td)
                    // querySelectorAll is returning incorrect result for $table.find('table tr'), it should only return any nested table tr but it is return own tr's as well. 
                    // therefore trying diff way to fetch the table's own rows
                    $($table.find('tr').not($table.find('> table tr')).get(i + 1)).prepend(td);
                  } else {
                    if ($(map[i + 1][col - 1])[0].parentNode) {
                      $(map[i + 1][col - 1])[0].insertAdjacentElement('afterend', td);
                    }
                  }
                }
              }
            } // Remove tbody or thead if there are no more rows.


            var $row_parent = $row.parent();
            $row.remove();

            if ($row_parent.find('tr').length === 0) {
              $row_parent.remove();
            } // Table has changed.


            map = _tableMap($table);
          }

          _updateCellSpan(0, map.length - 1, 0, map[0].length - 1, $table); // Update cursor position


          if (selection.min_i > 0) {
            // Place cursor in the row above selection.
            editor.selection.setAtEnd(map[selection.min_i - 1][0]);
          } else {
            // Place cursor in the row below selection.
            editor.selection.setAtEnd(map[0][0]);
          }

          editor.selection.restore(); // Hide table edit popup.

          editor.popups.hide('table.edit');
        }
      }
    }
    /*
     * Insert column method.
     */


    function insertColumn(position) {
      var $table = selectedTable(); // We have selection in a table.

      if ($table.length > 0) {
        // Create a table map.
        var map = _tableMap(); // Get selected cells from the table.


        var selection = _currentSelection(map); // Reference row.


        var ref_col;

        if (position == 'before') {
          ref_col = selection.min_j;
        } else {
          ref_col = selection.max_j;
        } // Old and new column widths.


        var old_width = 100 / map[0].length;
        var new_width = 100 / (map[0].length + 1); // Go through all cells and get their initial (old) widths.

        var $cell;
        $table.find('th, td').each(function () {
          $cell = $(this);
          $cell.data('old-width', $cell.outerWidth() / $table.outerWidth() * 100);
        }); // Parse each row to insert a new td.

        $table.find('tr').not($table.find('> table tr')).each(function (index) {
          // Get the exact td index before / after which we have to add the new td.
          // ref_col means the table column number, but this is not the same with the td number in a row.
          // We might have colspan or rowspan greater than 1.
          var $row = $(this);
          var col_no = 0;
          var td_no = 0;
          var ref_td; // Start with the first td (td_no = 0) in the current row.
          // Sum colspans (col_no) to see when we reach ref_col.
          // Summing colspans we get the same number with the table column number.

          while (col_no - 1 < ref_col) {
            // Get current td.
            ref_td = $row.find('> th, > td').get(td_no); // There are no more tds in this row.

            if (!ref_td) {
              ref_td = null;
              break;
            } // The current td is the same with the td from the table map.


            if (ref_td == map[index][col_no]) {
              // The current td might have colspan.
              col_no += parseInt($(ref_td).attr('colspan'), 10) || 1; // Go to the next td on the current row.

              td_no++;
            } // If current td is not the same with the td from the table map.
            // This means that this table cell (map[index][td_no]) has rowspan.
            // There is at least one td less on this row due to rowspan (based on map[index][td_no] colspan value).
            // We want to count this as a column as well.
            else {
                col_no += parseInt($(map[index][col_no]).attr('colspan'), 10) || 1; // ref_td is one td ahead. Get previous td if we want to insert column after.

                if (position == 'after') {
                  // There is a rowspan and so ref_td is the first td, but it is not in the first column.
                  if (td_no === 0) {
                    ref_td = -1;
                  } else {
                    ref_td = $row.find('> th, > td').get(td_no - 1);
                  }
                }
              }
          }

          var $ref_td = $(ref_td); // If the computed column number is higher than the reference number
          // then on this row we have a colspan longer than the reference column.
          // When adding a column after we should increase colspan on this row.
          //
          // If we want to add a column before, but the td on the reference column is
          // the same with the previous one then we have a td with colspan that
          // starts before the column reference number.
          // When adding a column before we should increase colspan on this row.

          if (position == 'after' && col_no - 1 > ref_col || position == 'before' && ref_col > 0 && map[index][ref_col] == map[index][ref_col - 1]) {
            // Don't increase twice for rowspan.
            if (index === 0 || index > 0 && map[index][ref_col] != map[index - 1][ref_col]) {
              var colspan = parseInt($ref_td.attr('colspan'), 10) + 1;
              $ref_td.attr('colspan', colspan); // Update this cell's width.

              $ref_td.css('width', ($ref_td.data('old-width') * new_width / old_width + new_width).toFixed(4) + '%');
              $ref_td.removeData('old-width');
            }
          } else {
            // Create HTML for a new cell.
            var td; // Might be a td or a th.

            if ($row.find('th').length > 0) {
              td = '<th style="width: ' + new_width.toFixed(4) + '%;"><br></th>';
            } else {
              td = '<td style="width: ' + new_width.toFixed(4) + '%;"><br></td>';
            } // Insert exactly at the beginning.


            if (ref_td == -1) {
              $row.prepend(td); // Insert exactly at the end.
            } else if (ref_td == null) {
              $row.append(td); // Insert td on the current row.
            } else {
              if (position == 'before') {
                $ref_td.before(td);
              } else if (position == 'after') {
                if ($ref_td[0].parentNode) {
                  $ref_td[0].insertAdjacentHTML('afterend', td);
                }
              }
            }
          }
        }); // Parse each row to update cells' width.

        $table.find('th, td').each(function () {
          $cell = $(this); // Update width and remove data.

          if ($cell.data('old-width')) {
            $cell.css('width', ($cell.data('old-width') * new_width / old_width).toFixed(4) + '%');
            $cell.removeData('old-width');
          }
        }); // Reposition table edit popup.

        if (editor.popups.isVisible('table.edit')) {
          _showEditPopup();
        }
      }
    }
    /*
     * Delete column method.
     */


    function deleteColumn() {
      var $table = selectedTable(); // We have selection in a table.

      if ($table.length > 0) {
        var i;
        var j;
        var $cell; // Create a table map.

        var map = _tableMap(); // Get selected cells from the table.


        var selection = _currentSelection(map); // Return if no selected column


        if (selection == null) {
          return;
        } // If all the rows are selected then delete the entire table.


        if (selection.min_j === 0 && selection.max_j == map[0].length - 1) {
          remove();
        } else {
          // Old width of all the columns that remain afte the delete.
          var old_width = 0; // Go through all cells and get their initial (old) widths.

          for (i = 0; i < map.length; i++) {
            for (j = 0; j < map[0].length; j++) {
              $cell = $(map[i][j]);

              if (!$cell.hasClass('fr-selected-cell')) {
                $cell.data('old-width', $cell.outerWidth() / $table.outerWidth() * 100);

                if (j < selection.min_j || j > selection.max_j) {
                  old_width += $cell.outerWidth() / $table.outerWidth() * 100;
                }
              }
            }
          }

          old_width /= map.length; // We should delete selected columns.

          for (j = selection.max_j; j >= selection.min_j; j--) {
            // Go through the table map to check for colspan.
            for (i = 0; i < map.length; i++) {
              // Don't do this twice if we have a rowspan.
              if (i === 0 || map[i][j] != map[i - 1][j]) {
                // We should decrease colspan.
                $cell = $(map[i][j]);

                if ((parseInt($cell.attr('colspan'), 10) || 1) > 1) {
                  var colspan = parseInt($cell.attr('colspan'), 10) - 1;

                  if (colspan == 1) {
                    $cell.removeAttr('colspan');
                  } else {
                    $cell.attr('colspan', colspan);
                  } // Update cell width.


                  $cell.css('width', (($cell.data('old-width') - _columnWidth(j, map)) * 100 / old_width).toFixed(4) + '%');
                  $cell.removeData('old-width'); // If there is no colspan delete the cell.
                } else {
                  // We might need to delete the row too if it is empty.
                  var $row = $($cell.parent().get(0));
                  $cell.remove(); // Check if there are any more tds in the current row.

                  if ($row.find('> th, > td').length === 0) {
                    // Check if it is okay to delete the tr.
                    if ($row.prev().length === 0 || $row.next().length === 0 || $row.prev().find('> th[rowspan], > td[rowspan]').length < $row.prev().find('> th, > td').length) {
                      $row.remove();
                    }
                  }
                }
              }
            }
          }

          _updateCellSpan(0, map.length - 1, 0, map[0].length - 1, $table); // Update cursor position


          if (selection.min_j > 0) {
            // Place cursor in the column before selection.
            editor.selection.setAtEnd(map[selection.min_i][selection.min_j - 1]);
          } else {
            // Place cursor in the column after selection.
            editor.selection.setAtEnd(map[selection.min_i][0]);
          }

          editor.selection.restore(); // Hide table edit popup.

          editor.popups.hide('table.edit'); // Scale current cells' width after column has been deleted.

          $table.find('th, td').each(function () {
            $cell = $(this); // Update width and remove data.

            if ($cell.data('old-width')) {
              $cell.css('width', ($cell.data('old-width') * 100 / old_width).toFixed(4) + '%');
              $cell.removeData('old-width');
            }
          });
        }
      }
    }
    /*
     * Update or remove colspan attribute.
     */


    function _updateColspan(min_j, max_j, $table) {
      var i;
      var j;
      var k;
      var first_span;
      var span;
      var decrease = 0; // Create a table map.

      var map = _tableMap($table); // A column might have been deleted.


      max_j = Math.min(max_j, map[0].length - 1); // If max_j and min_j are the same, then only one column is selected and colspan is preserved.

      if (max_j > min_j) {
        // Find out how much we should decrease colspan.
        // Parsing only the first row is enough.
        for (j = min_j; j <= max_j; j++) {
          // This cell has colspan and has already been checked.
          if (j > min_j && map[0][j] == map[0][j - 1]) {
            continue;
          } // Current cell colspan


          first_span = Math.min(parseInt(map[0][j].getAttribute('colspan'), 10) || 1, max_j - min_j + 1); // Cell has colspan between min_j and max_j.

          /* j + 1 will never exceed the number of columns in a table.
           * A colspan is detected before the last column and all next cells on that row are skipped.
           */

          if (first_span > 1 && map[0][j] == map[0][j + 1]) {
            // The value we should decrease colspan with.
            decrease = first_span - 1; // Check all columns on the current row.
            // We found a colspan on the first row (i = 0), continue with second row (i = 1).

            for (i = 1; i < map.length; i++) {
              // This cell has rowspan and has already been checked.
              if (map[i][j] == map[i - 1][j]) {
                continue;
              } // Look for a colspan on the same columns.


              for (k = j; k < j + first_span; k++) {
                span = parseInt(map[i][k].getAttribute('colspan'), 10) || 1; // There are other cells with colspan on this column.

                /* k + 1 will never exceed the number of columns in a table.
                 * A colspan is detected before the last column and all next cells on that row are skipped.
                 */

                if (span > 1 && map[i][k] == map[i][k + 1]) {
                  decrease = Math.min(decrease, span - 1); // Skip colspan.

                  k += decrease;
                } else {
                  decrease = Math.max(0, decrease - 1); // Stop if decrease reaches 0.

                  if (!decrease) {
                    break;
                  }
                }
              } // Stop looking on the next columns if decrease reaches 0.


              if (!decrease) {
                break;
              }
            }
          }
        }
      } // Update colspan attribute.


      if (decrease) {
        _decreaseCellSpan(map, decrease, 'colspan', 0, map.length - 1, min_j, max_j);
      }
    }
    /*
     * Update or remove rowspan attribute.
     */


    function _updateRowspan(min_i, max_i, $table) {
      var i;
      var j;
      var k;
      var first_span;
      var span;
      var decrease = 0; // Create a table map.

      var map = _tableMap($table); // A row might have been deleted.


      max_i = Math.min(max_i, map.length - 1); // If max_i and min_i are the same, then only one row is selected and rowspan is preserved.

      if (max_i > min_i) {
        // Find out how much we should decrease rowspan.
        // Parsing only the first column is enough.
        for (i = min_i; i <= max_i; i++) {
          // This cell has rowspan and has already been checked.
          if (i > min_i && map[i][0] == map[i - 1][0]) {
            continue;
          } // Current cell rowspan


          first_span = Math.min(parseInt(map[i][0].getAttribute('rowspan'), 10) || 1, max_i - min_i + 1); // Cell has rowspan between min_i and max_i.

          /* i + 1 will never exceed the number of rows in a table.
           * A rowspan is detected before the last row and all next cells on that column are skipped.
           */

          if (first_span > 1 && map[i][0] == map[i + 1][0]) {
            // The value we should decrease rowspan with.
            decrease = first_span - 1; // Check all columns on the current row.
            // We found a rowspan on the first column (j = 0), continue with second column (j = 1).

            for (j = 1; j < map[0].length; j++) {
              // This cell has colspan and has already been checked.
              if (map[i][j] == map[i][j - 1]) {
                continue;
              } // Look for a rowspan on the same rows.


              for (k = i; k < i + first_span; k++) {
                span = parseInt(map[k][j].getAttribute('rowspan'), 10) || 1; // There are other cells with rowspan on this row.

                /* k + 1 will never exceed the number of rows in a table.
                 * A rowspan is detected before the last row and all next cells on that column are skipped.
                 */

                if (span > 1 && map[k][j] == map[k + 1][j]) {
                  decrease = Math.min(decrease, span - 1); // Skip rowspan.

                  k += decrease;
                } else {
                  decrease = Math.max(0, decrease - 1); // Stop if decrease reaches 0.

                  if (!decrease) {
                    break;
                  }
                }
              } // Stop looking on the next columns if decrease reaches 0.


              if (!decrease) {
                break;
              }
            }
          }
        }
      } // Update rowspan attribute.


      if (decrease) {
        _decreaseCellSpan(map, decrease, 'rowspan', min_i, max_i, 0, map[0].length - 1);
      }
    }
    /*
     * Decrease the colspan or rowspan with the amount specified.
     */


    function _decreaseCellSpan(map, decrease, span_type, min_i, max_i, min_j, max_j) {
      // Update span attribute.
      var i;
      var j;
      var span; // Go only through lines and columns that need to be updated.

      for (i = min_i; i <= max_i; i++) {
        for (j = min_j; j <= max_j; j++) {
          // This cell has rowspan or colspan and has already been checked.
          if (i > min_i && map[i][j] == map[i - 1][j] || j > min_j && map[i][j] == map[i][j - 1]) {
            continue;
          }

          span = parseInt(map[i][j].getAttribute(span_type), 10) || 1; // Update cell span.

          if (span > 1) {
            if (span - decrease > 1) map[i][j].setAttribute(span_type, span - decrease);else map[i][j].removeAttribute(span_type);
          }
        }
      }
    }
    /*
     * Update or remove colspan and rowspan attributes.
     */


    function _updateCellSpan(min_i, max_i, min_j, max_j, $table) {
      _updateRowspan(min_i, max_i, $table);

      _updateColspan(min_j, max_j, $table);
    }
    /*
     * Merge selected cells method.
     */


    function mergeCells() {
      // We have more than one cell selected in a table. Cannot merge td and th.
      if (selectedCells().length > 1 && (editor.$el.find('th.fr-selected-cell').length === 0 || editor.$el.find('td.fr-selected-cell').length === 0)) {
        _removeKeyboardSelectionHandlers(); // Create a table map.


        var map = _tableMap(); // Get selected cells.


        var selection = _currentSelection(map); // Return if no selected cells


        if (selection == null) {
          return;
        }

        var i;
        var $cell;
        var cells = editor.$el.find('.fr-selected-cell');
        var $first_cell = $(cells[0]);
        var $first_row = $first_cell.parent();
        var first_row_cells = $first_row.find('.fr-selected-cell');
        var $current_table = $first_cell.closest('table');
        var content = $first_cell.html();
        var width = 0; // Update cell width.

        for (i = 0; i < first_row_cells.length; i++) {
          width += $(first_row_cells[i]).outerWidth();
        } // Width might exceed 100% due to cell borders.


        $first_cell.css('width', Math.min(100, width / $current_table.outerWidth() * 100).toFixed(4) + '%'); // Set the colspan for the merged cells.

        if (selection.min_j < selection.max_j) {
          $first_cell.attr('colspan', selection.max_j - selection.min_j + 1);
        } // Set the rowspan for the merged cells.


        if (selection.min_i < selection.max_i) {
          $first_cell.attr('rowspan', selection.max_i - selection.min_i + 1);
        } // Go through all selected cells to merge their content.


        for (i = 1; i < cells.length; i++) {
          $cell = $(cells[i]); // If cell is empty, don't add only <br> tags.

          if ($cell.html() != '<br>' && $cell.html() !== '') {
            content += '<br>' + $cell.html();
          } // Remove cell.


          $cell.remove();
        } // Set the HTML content.


        $first_cell.html(content);
        editor.selection.setAtEnd($first_cell.get(0));
        editor.selection.restore(); // Enable toolbar.

        editor.toolbar.enable(); // Update rowspan before removing empty rows (otherwise table map is not correct).

        _updateRowspan(selection.min_i, selection.max_i, $current_table); // Merge is done, check if we have empty trs to clean.


        var empty_trs = $current_table.find('tr:empty');

        for (i = empty_trs.length - 1; i >= 0; i--) {
          $(empty_trs[i]).remove();
        } // Update colspan after removing empty rows and updating rowspan.


        _updateColspan(selection.min_j, selection.max_j, $current_table); // Reposition table edit popup.


        _showEditPopup();
      }
    }
    /*
     * Split cell horizontally method.
     */


    function splitCellHorizontally() {
      // We have only one cell selected in a table.
      if (selectedCells().length == 1) {
        var $selected_cell = editor.$el.find('.fr-selected-cell');
        var $current_row = $selected_cell.parent();
        var $current_table = $selected_cell.closest('table');
        var current_rowspan = parseInt($selected_cell.attr('rowspan'), 10); // Create a table map.

        var map = _tableMap();

        var cell_origin = _cellOrigin($selected_cell.get(0), map); // Create new td.


        var $new_td = $selected_cell.clone().html('<br>'); // Cell has rowspan.

        if (current_rowspan > 1) {
          // Split current cell's rowspan.
          var new_rowspan = Math.ceil(current_rowspan / 2);

          if (new_rowspan > 1) {
            $selected_cell.attr('rowspan', new_rowspan);
          } else {
            $selected_cell.removeAttr('rowspan');
          } // Update new td's rowspan.


          if (current_rowspan - new_rowspan > 1) {
            $new_td.attr('rowspan', current_rowspan - new_rowspan);
          } else {
            $new_td.removeAttr('rowspan');
          } // Find where we should insert the new td.


          var row = cell_origin.row + new_rowspan;
          var col = cell_origin.col === 0 ? cell_origin.col : cell_origin.col - 1; // Go back until we find a td on this row. We might have colspans and rowspans.

          while (col >= 0 && (map[row][col] == map[row][col - 1] || row > 0 && map[row][col] == map[row - 1][col])) {
            col--;
          }

          if (col == -1) {
            // We couldn't find a previous td on this row. Prepend the new td.
            // $($current_table.find('tr').not($current_table.find('table tr')).get(row)).prepend($new_td)
            // querySelectorAll is returning incorrect result for $table.find('table tr'), it should only return any nested table tr but it is return own tr's as well. 
            // therefore trying diff way to fetch the table's own rows
            $($current_table.find('tr').not($current_table.find('> table tr')).get(row)).prepend($new_td);
          } else {
            if ($(map[row][col])[0].parentNode) {
              $(map[row][col])[0].insertAdjacentElement('afterend', $new_td[0]);
            }
          }
        } else {
          // Add new row bellow with only one cell.
          var $row = $(document.createElement('tr')).append($new_td);
          var i; // Increase rowspan for all cells on the current row.

          for (i = 0; i < map[0].length; i++) {
            // Don't do this twice if we have a colspan.
            if (i === 0 || map[cell_origin.row][i] != map[cell_origin.row][i - 1]) {
              var $cell = $(map[cell_origin.row][i]);

              if (!$cell.is($selected_cell)) {
                $cell.attr('rowspan', (parseInt($cell.attr('rowspan'), 10) || 1) + 1);
              }
            }
          }

          if ($current_row[0].parentNode) {
            $current_row[0].insertAdjacentElement('afterend', $row[0]);
          }
        } // Remove selection


        _removeSelection(); // Hide table edit popup.


        editor.popups.hide('table.edit');
      }
    }
    /*
     * Split cell vertically method.
     */


    function splitCellVertically() {
      // We have only one cell selected in a table.
      if (selectedCells().length == 1) {
        var $selected_cell = editor.$el.find('.fr-selected-cell');
        var current_colspan = parseInt($selected_cell.attr('colspan'), 10) || 1;
        var parent_width = $selected_cell.parent().outerWidth();
        var width = $selected_cell.outerWidth(); // Create new td.

        var $new_td = $selected_cell.clone().html('<br>'); // Create a table map.

        var map = _tableMap();

        var cell_origin = _cellOrigin($selected_cell.get(0), map);

        if (current_colspan > 1) {
          // Split current colspan.
          var new_colspan = Math.ceil(current_colspan / 2);
          width = _columnsWidth(cell_origin.col, cell_origin.col + new_colspan - 1, map) / parent_width * 100;
          var new_width = _columnsWidth(cell_origin.col + new_colspan, cell_origin.col + current_colspan - 1, map) / parent_width * 100; // Update colspan for current cell.

          if (new_colspan > 1) {
            $selected_cell.attr('colspan', new_colspan);
          } else {
            $selected_cell.removeAttr('colspan');
          } // Update new td's colspan.


          if (current_colspan - new_colspan > 1) {
            $new_td.attr('colspan', current_colspan - new_colspan);
          } else {
            $new_td.removeAttr('colspan');
          } // Update cell width.


          $selected_cell.css('width', width.toFixed(4) + '%');
          $new_td.css('width', new_width.toFixed(4) + '%'); // Increase colspan for all cells on the current column.
        } else {
          var i;

          for (i = 0; i < map.length; i++) {
            // Don't do this twice if we have a rowspan.
            if (i === 0 || map[i][cell_origin.col] != map[i - 1][cell_origin.col]) {
              var $cell = $(map[i][cell_origin.col]);

              if (!$cell.is($selected_cell)) {
                var colspan = (parseInt($cell.attr('colspan'), 10) || 1) + 1;
                $cell.attr('colspan', colspan);
              }
            }
          } // Update cell width.


          width = width / parent_width * 100 / 2;
          $selected_cell.css('width', width.toFixed(4) + '%');
          $new_td.css('width', width.toFixed(4) + '%');
        } // Add a new td after the current one.


        if ($selected_cell[0].parentNode) {
          $selected_cell[0].insertAdjacentElement('afterend', $new_td[0]);
        } // Remove selection


        _removeSelection(); // Hide table edit popup.


        editor.popups.hide('table.edit');
      }
    }
    /*
     * Set background color to selected cells.
     */


    function setBackground(color) {
      var $selected_cells = editor.$el.find('.fr-selected-cell'); // Set background  color.

      if (color != 'REMOVE') {
        $selected_cells.css('background-color', editor.helpers.HEXtoRGB(color));
      } // Remove background color.
      else {
          $selected_cells.css('background-color', '');
        }

      _showEditPopup();
    }
    /*
     * Set vertical align to selected cells.
     */


    function verticalAlign(val) {
      editor.$el.find('.fr-selected-cell').css('vertical-align', val);
    }
    /*
     * Apply horizontal alignment to selected cells.
     */


    function horizontalAlign(val) {
      editor.$el.find('.fr-selected-cell').css('text-align', val);
    }
    /**
     * Apply specific style to selected table or selected cells.
     * val              class to apply.
     * obj              table or selected cells.
     * multiple_styles  editor.opts.tableStyles or editor.opts.tableCellStyles.
     * style            editor.opts.tableStyles or editor.opts.tableCellStyles
     */


    function applyStyle(val, obj, multiple_styles, styles) {
      if (obj.length > 0) {
        // Remove multiple styles.
        if (!multiple_styles) {
          var classes = Object.keys(styles);
          classes.splice(classes.indexOf(val), 1);
          obj.removeClass(classes.join(' '));
        }

        obj.toggleClass(val);
      }
    }
    /*
     * Create a table map.
     */


    function _tableMap($table) {
      $table = $table || null;
      var map = [];

      if ($table == null && selectedCells().length > 0) {
        $table = selectedTable();
      }

      if ($table) {
        $table.findVisible('tr').not($table.find('> table tr')).each(function (row, tr) {
          var $tr = $(tr);
          var c_index = 0;
          $tr.find('> th, > td').each(function (col, td) {
            var $td = $(td);
            var cspan = parseInt($td.attr('colspan'), 10) || 1;
            var rspan = parseInt($td.attr('rowspan'), 10) || 1;

            for (var i = row; i < row + rspan; i++) {
              for (var j = c_index; j < c_index + cspan; j++) {
                if (!map[i]) map[i] = [];

                if (!map[i][j]) {
                  map[i][j] = td;
                } else {
                  c_index++;
                }
              }
            }

            c_index += cspan;
          });
        });
      }

      return map;
    }
    /*
     * Get the i, j coordinates of a cell in the table map.
     * These are the coordinates where the cell starts.
     */


    function _cellOrigin(td, map) {
      for (var i = 0; i < map.length; i++) {
        for (var j = 0; j < map[i].length; j++) {
          if (map[i][j] == td) {
            return {
              row: i,
              col: j
            };
          }
        }
      }
    }
    /*
     * Get the i, j coordinates where a cell ends in the table map.
     */


    function _cellEnds(origin_i, origin_j, map) {
      var max_i = origin_i + 1;
      var max_j = origin_j + 1; // Compute max_i

      while (max_i < map.length) {
        if (map[max_i][origin_j] != map[origin_i][origin_j]) {
          max_i--;
          break;
        }

        max_i++;
      }

      if (max_i == map.length) {
        max_i--;
      } // Compute max_j


      while (max_j < map[origin_i].length) {
        if (map[origin_i][max_j] != map[origin_i][origin_j]) {
          max_j--;
          break;
        }

        max_j++;
      }

      if (max_j == map[origin_i].length) {
        max_j--;
      }

      return {
        row: max_i,
        col: max_j
      };
    }
    /*
     * Remove handler classes that are used to select table cells with keyboard.
     */


    function _removeKeyboardSelectionHandlers() {
      if (editor.el.querySelector('.fr-cell-fixed')) {
        editor.el.querySelector('.fr-cell-fixed').classList.remove('fr-cell-fixed');
      }

      if (editor.el.querySelector('.fr-cell-handler')) {
        editor.el.querySelector('.fr-cell-handler').classList.remove('fr-cell-handler');
      }
    }
    /*
     * Remove selection from cells.
     */


    function _removeSelection() {
      var cells = editor.$el.find('.fr-selected-cell');

      if (cells.length > 0) {
        // Remove selection.
        cells.each(function () {
          var $cell = $(this);
          $cell.removeClass('fr-selected-cell');

          if ($cell.attr('class') === '') {
            $cell.removeAttr('class');
          }
        });
      }

      _removeKeyboardSelectionHandlers();
    }
    /*
     * Clear selection to prevent Firefox cell selection.
     */


    function _clearSelection() {
      editor.events.disableBlur();
      editor.selection.clear(); // Prevent text selection while selecting multiple cells.
      // Happens in Chrome.

      editor.$el.addClass('fr-no-selection'); // Cursor will not appear if we don't make blur.

      editor.$el.blur();
      editor.events.enableBlur();
    }
    /*
     * Get current selected cells coordintates.
     */


    function _currentSelection(map) {
      var cells = editor.$el.find('.fr-selected-cell');

      if (cells.length > 0) {
        var min_i = map.length;
        var max_i = 0;
        var min_j = map[0].length;
        var max_j = 0;
        var i;

        for (i = 0; i < cells.length; i++) {
          var cellOrigin = _cellOrigin(cells[i], map);

          var cellEnd = _cellEnds(cellOrigin.row, cellOrigin.col, map);

          min_i = Math.min(cellOrigin.row, min_i);
          max_i = Math.max(cellEnd.row, max_i);
          min_j = Math.min(cellOrigin.col, min_j);
          max_j = Math.max(cellEnd.col, max_j);
        }

        return {
          min_i: min_i,
          max_i: max_i,
          min_j: min_j,
          max_j: max_j
        };
      } else {
        return null;
      }
    }
    /*
     * Minimum and maximum coordinates for the selection in the table map.
     */


    function _selectionLimits(min_i, max_i, min_j, max_j, map) {
      var first_i = min_i;
      var last_i = max_i;
      var first_j = min_j;
      var last_j = max_j;
      var i;
      var j;
      var cellOrigin;
      var cellEnd; // Go through first and last columns.

      for (i = first_i; i <= last_i; i++) {
        // First column.
        if ((parseInt($(map[i][first_j]).attr('rowspan'), 10) || 1) > 1 || (parseInt($(map[i][first_j]).attr('colspan'), 10) || 1) > 1) {
          cellOrigin = _cellOrigin(map[i][first_j], map);
          cellEnd = _cellEnds(cellOrigin.row, cellOrigin.col, map);
          first_i = Math.min(cellOrigin.row, first_i);
          last_i = Math.max(cellEnd.row, last_i);
          first_j = Math.min(cellOrigin.col, first_j);
          last_j = Math.max(cellEnd.col, last_j);
        } // Last column.


        if ((parseInt($(map[i][last_j]).attr('rowspan'), 10) || 1) > 1 || (parseInt($(map[i][last_j]).attr('colspan'), 10) || 1) > 1) {
          cellOrigin = _cellOrigin(map[i][last_j], map);
          cellEnd = _cellEnds(cellOrigin.row, cellOrigin.col, map);
          first_i = Math.min(cellOrigin.row, first_i);
          last_i = Math.max(cellEnd.row, last_i);
          first_j = Math.min(cellOrigin.col, first_j);
          last_j = Math.max(cellEnd.col, last_j);
        }
      } // Go through first and last rows.


      for (j = first_j; j <= last_j; j++) {
        // First row.
        if ((parseInt($(map[first_i][j]).attr('rowspan'), 10) || 1) > 1 || (parseInt($(map[first_i][j]).attr('colspan'), 10) || 1) > 1) {
          cellOrigin = _cellOrigin(map[first_i][j], map);
          cellEnd = _cellEnds(cellOrigin.row, cellOrigin.col, map);
          first_i = Math.min(cellOrigin.row, first_i);
          last_i = Math.max(cellEnd.row, last_i);
          first_j = Math.min(cellOrigin.col, first_j);
          last_j = Math.max(cellEnd.col, last_j);
        } // Last column.


        if ((parseInt($(map[last_i][j]).attr('rowspan'), 10) || 1) > 1 || (parseInt($(map[last_i][j]).attr('colspan'), 10) || 1) > 1) {
          cellOrigin = _cellOrigin(map[last_i][j], map);
          cellEnd = _cellEnds(cellOrigin.row, cellOrigin.col, map);
          first_i = Math.min(cellOrigin.row, first_i);
          last_i = Math.max(cellEnd.row, last_i);
          first_j = Math.min(cellOrigin.col, first_j);
          last_j = Math.max(cellEnd.col, last_j);
        }
      }

      if (first_i == min_i && last_i == max_i && first_j == min_j && last_j == max_j) {
        return {
          min_i: min_i,
          max_i: max_i,
          min_j: min_j,
          max_j: max_j
        };
      } else {
        return _selectionLimits(first_i, last_i, first_j, last_j, map);
      }
    }
    /*
     * Get the left and right offset position for the current selection.
     */


    function _selectionOffset(map) {
      var selection = _currentSelection(map); // Return if no selected item


      if (selection == null) {
        return;
      } // Top left cell.


      var $tl = $(map[selection.min_i][selection.min_j]); // Top right cell.

      var $tr = $(map[selection.min_i][selection.max_j]); // Bottom left cell.

      var $bl = $(map[selection.max_i][selection.min_j]);
      var left = $tl.length && $tl.offset().left;
      var right = $tr.length && $tr.offset().left + $tr.outerWidth();
      var top = $tl.length && $tl.offset().top;
      var bottom = $bl.length && $bl.offset().top + $bl.outerHeight();
      return {
        left: left,
        right: right,
        top: top,
        bottom: bottom
      };
    }
    /*
     * Select table cells.
     * firstCell is either the top left corner or the fr-cell-fixed corner of the selection.
     * lastCell is either the bottom right corner ot the fr-cell-handler of the selection.
     */


    function selectCells(firstCell, lastCell) {
      // If the first and last cells are the same then just select it.
      if ($(firstCell).is(lastCell)) {
        // Remove previous selection.
        _removeSelection();

        $(firstCell).addClass('fr-selected-cell');
      } // Select multiple cells.
      else {
          // Prevent Firefox cell selection.
          _clearSelection(); // Turn editor toolbar off.


          editor.edit.off(); // Create a table map.

          var map = _tableMap(); // Get first and last cell's i and j map coordinates.


          var firstCellOrigin = _cellOrigin(firstCell, map);

          var lastCellOrigin = _cellOrigin(lastCell, map); // Some cells between these coordinates might have colspan or rowspan.
          // The selected area exceeds first and last cells' coordinates.


          var limits = _selectionLimits(Math.min(firstCellOrigin.row, lastCellOrigin.row), Math.max(firstCellOrigin.row, lastCellOrigin.row), Math.min(firstCellOrigin.col, lastCellOrigin.col), Math.max(firstCellOrigin.col, lastCellOrigin.col), map); // Remove previous selection.


          _removeSelection(); // We always need to set the selection handler classes as user may use keyboard to select at anytime.


          firstCell.classList.add('fr-cell-fixed');
          lastCell.classList.add('fr-cell-handler'); // Select all cells between the first and last cell.

          for (var i = limits.min_i; i <= limits.max_i; i++) {
            for (var j = limits.min_j; j <= limits.max_j; j++) {
              $(map[i][j]).addClass('fr-selected-cell');
            }
          }
        }
    }
    /*
     * Get the cell under the mouse cursor.
     */


    function _getCellUnder(e) {
      var cell = null;
      var $target = $(e.target);

      if (e.target.tagName == 'TD' || e.target.tagName == 'TH') {
        cell = e.target;
      } else if ($target.closest('td', $target.closest('tr')[0]).length > 0) {
        cell = $target.closest('td', $target.closest('tr')[0]).get(0);
      } else if ($target.closest('th', $target.closest('thead')[0]).length > 0) {
        cell = $target.closest('th', $target.closest('thead')[0]).get(0);
      } // Cell should reside inside editor.


      if (editor.$el.html.toString().search(cell) === -1) return null;
      return cell;
    }
    /*
     * Stop table cell editing and allow text editing.
     */


    function _stopEdit() {
      // Clear previous selection.
      _removeSelection(); // Hide table edit popup.


      editor.popups.hide('table.edit');
    }
    /*
     * Mark that mouse is down.
     */


    function _mouseDown(e) {
      var cell = _getCellUnder(e);

      if ($(cell).parents('[contenteditable]').not('.fr-element').not('.fr-img-caption').not('body').first().attr('contenteditable') == 'false') return true; // Stop table editing if user clicks outside the table.

      if (selectedCells().length > 0 && !cell) {
        _stopEdit();
      } // Only do mouseDown if the editor is not disabled by user.


      if (!editor.edit.isDisabled() || editor.popups.isVisible('table.edit')) {
        // On left click.
        if (e.which == 1 && !(e.which == 1 && editor.helpers.isMac() && e.ctrlKey)) {
          mouseDownFlag = true; // User clicked on a table cell.

          if (cell) {
            // We always have to clear previous selection except when using shift key to select multiple cells.
            if (selectedCells().length > 0 && !e.shiftKey) {
              _stopEdit();
            }

            e.stopPropagation();
            editor.events.trigger('image.hideResizer');
            editor.events.trigger('video.hideResizer'); // Keep record of left mouse click being down

            mouseDownCellFlag = true;
            var tag_name = cell.tagName.toLowerCase(); // Select multiple cells using Shift key

            if (e.shiftKey && editor.$el.find(tag_name + '.fr-selected-cell').length > 0) {
              // Cells must be in the same table.
              if ($(editor.$el.find(tag_name + '.fr-selected-cell').closest('table')).is($(cell).closest('table'))) {
                // Select cells between.
                selectCells(mouseDownCell, cell); // Do nothing if cells are not in the same table.
              } else {
                // Prevent Firefox selection.
                _clearSelection();
              }
            } else {
              // Prevent Firefox selection for ctrl / cmd key.
              // https://github.com/froala/wysiwyg-editor/issues/1323:
              //  - we have more than one cell selected or
              //  - selection is starting in another cell than the one we clicked on.
              if ((editor.keys.ctrlKey(e) || e.shiftKey) && (selectedCells().length > 1 || $(cell).find(editor.selection.element()).length === 0 && !$(cell).is(editor.selection.element()))) {
                _clearSelection();
              } // Save cell where mouse has been clicked


              mouseDownCell = cell; // Select cell.

              if (editor.opts.tableEditButtons.length > 0) {
                selectCells(mouseDownCell, mouseDownCell);
              }
            }
          }
        } // On right click stop table editing.
        else if ((e.which == 3 || e.which == 1 && editor.helpers.isMac() && e.ctrlKey) && cell) {
            _stopEdit();
          }
      }
    }
    /*
     * Notify that mouse is no longer pressed.
     */


    function _mouseUp(e) {
      // Mouse down started in a popup and ends in the editor.
      // https://github.com/froala/wysiwyg-editor/issues/3190
      if (editor.popups.areVisible()) {
        return true;
      } // User clicked somewhere else in the editor (except the toolbar).
      // We need this because mouse down is not triggered outside the editor.


      if (!mouseDownCellFlag && !editor.$tb.is(e.target) && !editor.$tb.is($(e.target).closest('.fr-toolbar'))) {
        if (selectedCells().length > 0) {
          editor.toolbar.enable();
        }

        _removeSelection();
      } // On left click.


      if (e.which == 1 && !(e.which == 1 && editor.helpers.isMac() && e.ctrlKey)) {
        mouseDownFlag = false; // Mouse down was in a table cell.

        if (mouseDownCellFlag) {
          // Left click is no longer pressed.
          mouseDownCellFlag = false;

          var cell = _getCellUnder(e); // If we have one selected cell and mouse is lifted somewhere else.


          if (!cell && selectedCells().length == 1) {
            // We have a text selection and not cell selection.
            _removeSelection();
          } // If there are selected cells then show table edit popup.
          else if (selectedCells().length > 0) {
              if (editor.selection.isCollapsed()) {
                _showEditPopup();
              } // No text selection.
              else {
                  _removeSelection();

                  editor.edit.on();
                }
            }
        } // Resizing stops.


        if (resizingFlag) {
          resizingFlag = false;
          $resizer.removeClass('fr-moving'); // Allow text selection.

          editor.$el.removeClass('fr-no-selection');
          editor.edit.on(); // Set release Y coordinate.

          var left = parseFloat($resizer.css('left')) + editor.opts.tableResizerOffset + editor.$wp.offset().left;

          if (editor.opts.iframe) {
            left -= editor.$iframe.offset().left;
          }

          $resizer.data('release-position', left); // Clear resizing limits.

          $resizer.removeData('max-left');
          $resizer.removeData('max-right'); // Resize.

          _resize(e); // Hide resizer.


          _hideResizer();
        }
      }
    }
    /*
     * User drags mouse over multiple cells to select them.
     */


    function _mouseEnter(e) {
      if (mouseDownCellFlag === true && editor.opts.tableEditButtons.length > 0) {
        var $cell = $(e.currentTarget); // Cells should be in the same table.

        if ($cell.closest('table').is(selectedTable())) {
          // Don't select both ths and tds.
          if (e.currentTarget.tagName == 'TD' && editor.$el.find('th.fr-selected-cell').length === 0) {
            // Select cells between.
            selectCells(mouseDownCell, e.currentTarget);
            return;
          } else if (e.currentTarget.tagName == 'TH' && editor.$el.find('td.fr-selected-cell').length === 0) {
            // Select cells between.
            selectCells(mouseDownCell, e.currentTarget);
            return;
          }
        } // Prevent firefox selection.


        _clearSelection();
      }
    }
    /*
     * Move cursor in a nested table.
     */


    function _moveInNestedTable(cell, direction) {
      var table = cell; // Get parent table (editor might be initialized inside cell).

      while (table && table.tagName != 'TABLE' && table.parentNode != editor.el) {
        table = table.parentNode;
      }

      if (table && table.tagName == 'TABLE') {
        var new_map = _tableMap($(table)); // Move up in the parent table.


        if (direction == 'up') _moveUp(_cellOrigin(cell, new_map), table, new_map);else if (direction == 'down') _moveDown(_cellOrigin(cell, new_map), table, new_map);
      }
    }
    /*
     * Move cursor up or down outside table.
     */


    function _moveWithArrows(origin, table, map, direction) {
      var up = table;
      var sibling; // Look up in DOM for the previous or next element.

      while (up != editor.el) {
        // Nested table.
        if (up.tagName == 'TD' || up.tagName == 'TH') {
          break;
        } // The table has a sibling element.


        if (direction == 'up') sibling = up.previousElementSibling;else if (direction == 'down') sibling = up.nextElementSibling;

        if (sibling) {
          break;
        } // Table might be in a block tag.


        up = up.parentNode;
      } // We have another table (nested).


      if (up.tagName == 'TD' || up.tagName == 'TH') {
        _moveInNestedTable(up, direction);
      } // Table has a sibling.
      else if (sibling) {
          if (direction == 'up') editor.selection.setAtEnd(sibling);
          if (direction == 'down') editor.selection.setAtStart(sibling);
        }
    }
    /*
     * Move cursor up while in table cell.
     */


    function _moveUp(origin, table, map) {
      // Not the first line.
      if (origin.row > 0) {
        editor.selection.setAtEnd(map[origin.row - 1][origin.col]);
      } // First line.
      else {
          _moveWithArrows(origin, table, map, 'up');
        }
    }
    /*
     * Move cursor down while in table cell.
     */


    function _moveDown(origin, table, map) {
      // Cell might have rowspan.
      var row = parseInt(map[origin.row][origin.col].getAttribute('rowspan'), 10) || 1; // Not the last line.

      if (origin.row < map.length - row) {
        editor.selection.setAtStart(map[origin.row + row][origin.col]);
      } // Last line.
      else {
          _moveWithArrows(origin, table, map, 'down');
        }
    }
    /*
     * Using the arrow keys to move the cursor through the table will not select cells.
     */


    function _navigateWithArrows(e) {
      var key_code = e.which; // Get current selection.

      var sel = editor.selection.blocks();

      if (sel.length) {
        sel = sel[0]; // Selection should be in a table cell.

        if (sel.tagName == 'TD' || sel.tagName == 'TH') {
          var table = sel; // Get parent table (editor might be initialized inside cell).

          while (table && table.tagName != 'TABLE' && table.parentNode != editor.el) {
            table = table.parentNode;
          }

          if (table && table.tagName == 'TABLE') {
            if (FE.KEYCODE.ARROW_LEFT == key_code || FE.KEYCODE.ARROW_UP == key_code || FE.KEYCODE.ARROW_RIGHT == key_code || FE.KEYCODE.ARROW_DOWN == key_code) {
              if (selectedCells().length > 0) {
                _stopEdit();
              } // Up and down in Webkit.


              if (editor.browser.webkit && (FE.KEYCODE.ARROW_UP == key_code || FE.KEYCODE.ARROW_DOWN == key_code)) {
                var node = editor.selection.ranges(0).startContainer;

                if (node.nodeType == Node.TEXT_NODE && (FE.KEYCODE.ARROW_UP == key_code && (node.previousSibling && node.previousSibling.tagName !== 'BR' || node.previousSibling && node.previousSibling.tagName === 'BR' && node.previousSibling.previousSibling) || FE.KEYCODE.ARROW_DOWN == key_code && (node.nextSibling && node.nextSibling.tagName !== 'BR' || node.nextSibling && node.nextSibling.tagName === 'BR' && node.nextSibling.nextSibling))) {
                  return;
                }

                e.preventDefault();
                e.stopPropagation(); // Table map.

                var map = _tableMap($(table)); // Current cell map coordinates.


                var origin = _cellOrigin(sel, map); // Arrow up


                if (FE.KEYCODE.ARROW_UP == key_code) {
                  _moveUp(origin, table, map);
                } // Arrow down
                else if (FE.KEYCODE.ARROW_DOWN == key_code) {
                    _moveDown(origin, table, map);
                  } // Update cursor position.


                editor.selection.restore();
                return false;
              }
            }
          }
        }
      }
    }
    /*
     * Initilize table resizer.
     */


    function _initResizer() {
      // Append resizer HTML to editor wrapper.
      if (!editor.shared.$table_resizer) editor.shared.$table_resizer = $(document.createElement('div')).attr('class', 'fr-table-resizer').html('<div></div>');
      $resizer = editor.shared.$table_resizer; // Resize table. Mousedown.

      editor.events.$on($resizer, 'mousedown', function (e) {
        if (!editor.core.sameInstance($resizer)) return true; // Stop table editing.

        if (selectedCells().length > 0) {
          _stopEdit();
        } // Resize table only using left click.


        if (e.which == 1) {
          // Save selection so that we can put cursor back at the end.
          editor.selection.save();
          resizingFlag = true;
          $resizer.addClass('fr-moving'); // Prevent text selection while dragging the table resizer.

          _clearSelection(); // Turn editor toolbar off while resizing.


          editor.edit.off(); // Show resizer.

          $resizer.find('div').css('opacity', 1); // Prevent selecting text when doing resize.

          return false;
        }
      }); // Mousemove on table resizer.

      editor.events.$on($resizer, 'mousemove', function (e) {
        if (!editor.core.sameInstance($resizer)) return true;

        if (resizingFlag) {
          if (editor.opts.iframe) {
            e.pageX -= editor.$iframe.offset().left;
          }

          _mouseMove(e);
        }
      }); // Editor destroy.

      editor.events.on('shared.destroy', function () {
        $resizer.html('').removeData().remove();
        $resizer = null;
      }, true);
      editor.events.on('destroy', function () {
        editor.$el.find('.fr-selected-cell').removeClass('fr-selected-cell');
        $('body').first().append($resizer.hide());
      }, true);
    }
    /*
     * Also clears top and left values, so it doesn't interfer with the insert helper.
     */


    function _hideResizer() {
      if ($resizer) {
        $resizer.find('div').css('opacity', 0);
        $resizer.css('top', 0);
        $resizer.css('left', 0);
        $resizer.css('height', 0);
        $resizer.find('div').css('height', 0);
        $resizer.hide();
      }
    }
    /**
     * Hide the insert helper.
     */


    function _hideInsertHelper() {
      if ($insert_helper) $insert_helper.removeClass('fr-visible').css('left', '-9999px');
    }
    /*
     * Place the table resizer between the columns where the mouse is.
     */


    function _placeResizer(e, tag_under) {
      var $tag_under = $(tag_under);
      var $table = $tag_under.closest('table');
      var $table_parent = $table.parent(); // We might have another tag inside the table cell.

      if (tag_under && tag_under.tagName != 'TD' && tag_under.tagName != 'TH') {
        if ($tag_under.closest('td').length > 0) {
          tag_under = $tag_under.closest('td');
        } else if ($tag_under.closest('th').length > 0) {
          tag_under = $tag_under.closest('th');
        }
      } // The tag should be a table cell (TD or TH).


      if (tag_under && (tag_under.tagName == 'TD' || tag_under.tagName == 'TH')) {
        $tag_under = $(tag_under); // https://github.com/froala/wysiwyg-editor/issues/786.

        if (editor.$el.find($tag_under).length === 0) return false; // Tag's left and right coordinate.

        var tag_left = $tag_under.offset().left - 1;
        var tag_right = tag_left + $tag_under.outerWidth(); // Only if the mouse is close enough to the left or right edges.

        if (Math.abs(e.pageX - tag_left) <= editor.opts.tableResizerOffset || Math.abs(tag_right - e.pageX) <= editor.opts.tableResizerOffset) {
          // Create a table map.
          var map = _tableMap($table);

          var tag_origin = _cellOrigin(tag_under, map);

          var tag_end = _cellEnds(tag_origin.row, tag_origin.col, map); // The column numbers from the map that have to be resized.


          var first;
          var second; // Table resizer position and height.

          var resizer_top = $table.offset().top;
          var resizer_height = $table.outerHeight() - 1;
          var resizer_left; // The left and right limits between which the resizer can be moved.

          var max_left;
          var max_right;

          if (editor.opts.direction != 'rtl') {
            // Mouse is near the cells's left margin.
            if (e.pageX - tag_left <= editor.opts.tableResizerOffset) {
              // Table resizer's left position.
              resizer_left = tag_left; // Resize cells.

              if (tag_origin.col > 0) {
                // Left limit.
                max_left = tag_left - _columnWidth(tag_origin.col - 1, map) + editor.opts.tableResizingLimit; // Right limit.

                max_right = tag_left + _columnWidth(tag_origin.col, map) - editor.opts.tableResizingLimit; // Columns to resize.

                first = tag_origin.col - 1;
                second = tag_origin.col;
              } // Resize table.
              else {
                  // Columns to resize.
                  first = null;
                  second = 0; // Resizer limits.

                  max_left = $table.offset().left - 1 - parseInt($table.css('margin-left'), 10);
                  max_right = $table.offset().left - 1 + $table.width() - map[0].length * editor.opts.tableResizingLimit;
                }
            } // Mouse is near the cell's right margin.
            else if (tag_right - e.pageX <= editor.opts.tableResizerOffset) {
                // Table resizer's left possition.
                resizer_left = tag_right; // Check for next td.

                if (tag_end.col < map[tag_end.row].length && map[tag_end.row][tag_end.col + 1]) {
                  // Left limit.
                  max_left = tag_right - _columnWidth(tag_end.col, map) + editor.opts.tableResizingLimit; // Right limit.

                  max_right = tag_right + _columnWidth(tag_end.col + 1, map) - editor.opts.tableResizingLimit; // Columns to resize.

                  first = tag_end.col;
                  second = tag_end.col + 1;
                } // Resize table.
                else {
                    // Columns to resize.
                    first = tag_end.col;
                    second = null; // Resizer limits.

                    max_left = $table.offset().left - 1 + map[0].length * editor.opts.tableResizingLimit;
                    max_right = $table_parent.offset().left - 1 + $table_parent.width() + parseFloat($table_parent.css('padding-left'));
                  }
              }
          } // RTL
          else {
              // Mouse is near the cell's right margin.
              if (tag_right - e.pageX <= editor.opts.tableResizerOffset) {
                // Table resizer's left position.
                resizer_left = tag_right; // Resize cells.

                if (tag_origin.col > 0) {
                  // Left limit.
                  max_left = tag_right - _columnWidth(tag_origin.col, map) + editor.opts.tableResizingLimit; // Right limit.

                  max_right = tag_right + _columnWidth(tag_origin.col - 1, map) - editor.opts.tableResizingLimit; // Columns to resize.

                  first = tag_origin.col;
                  second = tag_origin.col - 1;
                } // Resize table.
                else {
                    first = null;
                    second = 0; // Resizer limits.

                    max_left = $table.offset().left + map[0].length * editor.opts.tableResizingLimit;
                    max_right = $table_parent.offset().left - 1 + $table_parent.width() + parseFloat($table_parent.css('padding-left'));
                  }
              } // Mouse is near the cell's left margin.
              else if (e.pageX - tag_left <= editor.opts.tableResizerOffset) {
                  // Table resizer's left position.
                  resizer_left = tag_left; // Check for next td.

                  if (tag_end.col < map[tag_end.row].length && map[tag_end.row][tag_end.col + 1]) {
                    // Left limit.
                    max_left = tag_left - _columnWidth(tag_end.col + 1, map) + editor.opts.tableResizingLimit; // Right limit.

                    max_right = tag_left + _columnWidth(tag_end.col, map) - editor.opts.tableResizingLimit; // Columns to resize.

                    first = tag_end.col + 1;
                    second = tag_end.col;
                  } // Resize table.
                  else {
                      // Columns to resize.
                      first = tag_end.col;
                      second = null; // Resizer limits.

                      max_left = $table_parent.offset().left + parseFloat($table_parent.css('padding-left'));
                      max_right = $table.offset().left - 1 + $table.width() - map[0].length * editor.opts.tableResizingLimit;
                    }
                }
            }

          if (!$resizer) _initResizer(); // Save table.

          $resizer.data('table', $table); // Save columns to resize.

          $resizer.data('first', first);
          $resizer.data('second', second);
          $resizer.data('instance', editor);
          editor.$wp.append($resizer);
          var left = resizer_left - editor.win.pageXOffset - editor.opts.tableResizerOffset - editor.$wp.offset().left;
          var top = resizer_top - editor.$wp.offset().top + editor.$wp.scrollTop();

          if (editor.opts.iframe) {
            var iframePaddingTop = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-top'));
            var iframePaddingLeft = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-left'));
            left += editor.$iframe.offset().left + iframePaddingLeft;
            top += editor.$iframe.offset().top + iframePaddingTop;
            max_left += editor.$iframe.offset().left;
            max_right += editor.$iframe.offset().left;
          } // Set resizing limits.


          $resizer.data('max-left', max_left);
          $resizer.data('max-right', max_right); // Initial position of the resizer

          $resizer.data('origin', resizer_left - editor.win.pageXOffset); // Set table resizer's top, left and height.

          $resizer.css('top', top);
          $resizer.css('left', left);
          $resizer.css('height', resizer_height);
          $resizer.find('div').css('height', resizer_height); // Set padding according to tableResizerOffset.

          $resizer.css('padding-left', editor.opts.tableResizerOffset);
          $resizer.css('padding-right', editor.opts.tableResizerOffset); // Show table resizer.

          $resizer.show();
        } // Hide resizer when the mouse moves away from the cell's border.
        else {
            if (editor.core.sameInstance($resizer)) _hideResizer();
          }
      } // Hide resizer if mouse is no longer over it.
      else if ($resizer && $tag_under.get(0) != $resizer.get(0) && $tag_under.parent().get(0) != $resizer.get(0)) {
          if (editor.core.sameInstance($resizer)) _hideResizer();
        }
    }
    /*
     * Show the insert column helper button.
     */


    function _showInsertColHelper(e, table) {
      if (editor.$box.find('.fr-line-breaker').isVisible()) return false; // Insert Helper.

      if (!$insert_helper) _initInsertHelper();
      editor.$box.append($insert_helper);
      $insert_helper.data('instance', editor);
      var $table = $(table);
      var $row = $table.find('tr').first();
      var mouseX = e.pageX;
      var left = 0;
      var top = 0;

      if (editor.opts.iframe) {
        var iframePaddingTop = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-top'));
        var iframePaddingLeft = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-left'));
        left += editor.$iframe.offset().left - editor.helpers.scrollLeft() + iframePaddingLeft;
        top += editor.$iframe.offset().top - editor.helpers.scrollTop() + iframePaddingTop;
      } // Check where the column should be inserted.


      var btn_width;
      $row.find('th, td').each(function () {
        var $td = $(this); // Insert before this td.

        if ($td.offset().left <= mouseX && mouseX < $td.offset().left + $td.outerWidth() / 2) {
          btn_width = parseInt($insert_helper.find('a').css('width'), 10);
          $insert_helper.css('top', top + $td.offset().top - editor.$box.offset().top - btn_width - 5);
          $insert_helper.css('left', left + $td.offset().left - editor.$box.offset().left - btn_width / 2);
          $insert_helper.data('selected-cell', $td);
          $insert_helper.data('position', 'before');
          $insert_helper.addClass('fr-visible');
          return false; // Insert after this td.
        } else if ($td.offset().left + $td.outerWidth() / 2 <= mouseX && mouseX < $td.offset().left + $td.outerWidth()) {
          btn_width = parseInt($insert_helper.find('a').css('width'), 10);
          $insert_helper.css('top', top + $td.offset().top - editor.$box.offset().top - btn_width - 5);
          $insert_helper.css('left', left + $td.offset().left - editor.$box.offset().left + $td.outerWidth() - btn_width / 2);
          $insert_helper.data('selected-cell', $td);
          $insert_helper.data('position', 'after');
          $insert_helper.addClass('fr-visible');
          return false;
        }
      });
    }
    /*
     * Show the insert row helper button.
     */


    function _showInsertRowHelper(e, table) {
      if (editor.$box.find('.fr-line-breaker').isVisible()) return false;
      if (!$insert_helper) _initInsertHelper();
      editor.$box.append($insert_helper);
      $insert_helper.data('instance', editor);
      var $table = $(table);
      var mouseY = e.pageY;
      var left = 0;
      var top = 0;

      if (editor.opts.iframe) {
        var iframePaddingTop = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-top'));
        var iframePaddingLeft = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-left'));
        left += editor.$iframe.offset().left - editor.helpers.scrollLeft() + iframePaddingLeft;
        top += editor.$iframe.offset().top - editor.helpers.scrollTop() + iframePaddingTop;
      } // Check where the row should be inserted.


      var btn_width;
      $table.find('tr').each(function () {
        var $tr = $(this); // Insert above this tr.

        if ($tr.offset().top <= mouseY && mouseY < $tr.offset().top + $tr.outerHeight() / 2) {
          btn_width = parseInt($insert_helper.find('a').css('width'), 10);
          $insert_helper.css('top', top + $tr.offset().top - editor.$box.offset().top - btn_width / 2);
          $insert_helper.css('left', left + $tr.offset().left - editor.$box.offset().left - btn_width - 5);
          $insert_helper.data('selected-cell', $tr.find('td').first());
          $insert_helper.data('position', 'above');
          $insert_helper.addClass('fr-visible');
          return false; // Insert below this tr.
        } else if ($tr.offset().top + $tr.outerHeight() / 2 <= mouseY && mouseY < $tr.offset().top + $tr.outerHeight()) {
          btn_width = parseInt($insert_helper.find('a').css('width'), 10);
          $insert_helper.css('top', top + $tr.offset().top - editor.$box.offset().top + $tr.outerHeight() - btn_width / 2);
          $insert_helper.css('left', left + $tr.offset().left - editor.$box.offset().left - btn_width - 5);
          $insert_helper.data('selected-cell', $tr.find('td').first());
          $insert_helper.data('position', 'below');
          $insert_helper.addClass('fr-visible');
          return false;
        }
      });
    }
    /*
     * Check if should show the insert column / row helper button.
     */


    function _insertHelper(e, tag_under) {
      // Don't show the insert helper if there are table cells selected.
      if (selectedCells().length === 0) {
        var i;
        var tag_below;
        var tag_right; // Tag is the editor element or body (inline toolbar). Look for closest tag bellow and at the right.

        if (tag_under && (tag_under.tagName == 'HTML' || tag_under.tagName == 'BODY' || editor.node.isElement(tag_under))) {
          // Look 1px down until a table tag is found or the insert helper offset is reached.
          for (i = 1; i <= editor.opts.tableInsertHelperOffset; i++) {
            // Look for tag below.
            tag_below = editor.doc.elementFromPoint(e.pageX - editor.win.pageXOffset, e.pageY - editor.win.pageYOffset + i); // We're on tooltip.

            if ($(tag_below).hasClass('fr-tooltip')) return true; // We found a tag bellow.
            // https://github.com/froala-labs/froala-editor-js-2/issues/1571
            // Condition added to avoid showing insert helper when the table has contenteditable:false

            if (tag_below && (tag_below.tagName == 'TH' || tag_below.tagName == 'TD' || tag_below.tagName == 'TABLE') && ($(tag_below).parents('.fr-wrapper').length || editor.opts.iframe) && $(tag_below).closest('table').attr('contenteditable') != 'false') {
              // Show the insert column helper button.
              _showInsertColHelper(e, $(tag_below).closest('table'));

              return true;
            } // Look for tag at the right.


            tag_right = editor.doc.elementFromPoint(e.pageX - editor.win.pageXOffset + i, e.pageY - editor.win.pageYOffset); // We're on tooltip.

            if ($(tag_right).hasClass('fr-tooltip')) return true; // We found a tag at the right.
            // https://github.com/froala-labs/froala-editor-js-2/issues/1571
            // Condition added to avoid showing insert helper when the table has contenteditable:false

            if (tag_right && (tag_right.tagName == 'TH' || tag_right.tagName == 'TD' || tag_right.tagName == 'TABLE') && ($(tag_right).parents('.fr-wrapper').length || editor.opts.iframe) && $(tag_right).closest('table').attr('contenteditable') != 'false') {
              // Show the insert row helper button.
              _showInsertRowHelper(e, $(tag_right).closest('table'));

              return true;
            }
          }
        } // Hide insert helper.


        if (editor.core.sameInstance($insert_helper)) {
          _hideInsertHelper();
        }
      }
    }
    /*
     * Check tag under the mouse on mouse move.
     */


    function _tagUnder(e) {
      mouseMoveTimer = null; // The tag under the mouse cursor.

      var tag_under = editor.doc.elementFromPoint(e.pageX - editor.win.pageXOffset, e.pageY - editor.win.pageYOffset); // Place table resizer if necessary.

      if (editor.opts.tableResizer && (!editor.popups.areVisible() || editor.popups.areVisible() && editor.popups.isVisible('table.edit'))) {
        _placeResizer(e, tag_under);
      } // Show the insert column / row helper button.


      if (editor.opts.tableInsertHelper && !editor.popups.areVisible() && !(editor.$tb.hasClass('fr-inline') && editor.$tb.isVisible())) {
        _insertHelper(e, tag_under);
      }
    }
    /*
     * Repositon the resizer if the user scrolls while resizing.
     */


    function _repositionResizer() {
      if (resizingFlag) {
        var $table = $resizer.data('table');
        var top = $table.offset().top - editor.win.pageYOffset;

        if (editor.opts.iframe) {
          var iframePaddingTop = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-top'));
          top += editor.$iframe.offset().top - editor.helpers.scrollTop() + iframePaddingTop;
        }

        $resizer.css('top', top);
      }
    }
    /*
     * Resize table method.
     */


    function _resize() {
      // Resizer initial position.
      var initial_positon = $resizer.data('origin'); // Resizer release position.

      var release_position = $resizer.data('release-position'); // Do resize only if the resizer's position has changed.

      if (initial_positon !== release_position) {
        // Columns that have to be resized.
        var first = $resizer.data('first');
        var second = $resizer.data('second');
        var $table = $resizer.data('table');
        var table_width = $table.outerWidth();
        if (!editor.undo.canDo()) editor.undo.saveStep(); // Resize columns and not the table.

        if (first != null && second != null) {
          // Create a table map.
          var map = _tableMap($table); // Got through all cells on these columns and get their initial width.


          var first_widths = [];
          var first_percentages = [];
          var second_widths = [];
          var second_percentages = [];
          var i;
          var $first_cell;
          var $second_cell; // We must do this before updating widths.

          for (i = 0; i < map.length; i++) {
            $first_cell = $(map[i][first]);
            $second_cell = $(map[i][second]); // Widths in px.

            first_widths[i] = $first_cell.outerWidth();
            second_widths[i] = $second_cell.outerWidth(); // Widths in percentages.

            first_percentages[i] = first_widths[i] / table_width * 100;
            second_percentages[i] = second_widths[i] / table_width * 100;
          } // Got through all cells on these columns and update their widths.


          for (i = 0; i < map.length; i++) {
            $first_cell = $(map[i][first]);
            $second_cell = $(map[i][second]); // There is a colspan.

            if (map[i][first] != map[i][second]) {
              // New percentage for the first cell.
              var first_cell_percentage = (first_percentages[i] * (first_widths[i] + release_position - initial_positon) / first_widths[i]).toFixed(4);
              $first_cell.css('width', first_cell_percentage + '%');
              $second_cell.css('width', (first_percentages[i] + second_percentages[i] - first_cell_percentage).toFixed(4) + '%');
            }
          }
        } // Resize the table.
        else {
            var $table_parent = $table.parent();
            var table_percentage = table_width / $table_parent.width() * 100;
            var left_margin = (parseInt($table.css('margin-left'), 10) || 0) / $table_parent.width() * 100;
            var right_margin = (parseInt($table.css('margin-right'), 10) || 0) / $table_parent.width() * 100;
            var width; // Right border RTL or LTR.

            if (editor.opts.direction == 'rtl' && second === 0 || editor.opts.direction != 'rtl' && second !== 0) {
              width = (table_width + release_position - initial_positon) / table_width * table_percentage;
              $table.css('margin-right', 'calc(100% - ' + Math.round(width).toFixed(4) + '% - ' + Math.round(left_margin).toFixed(4) + '%)');
            } // Left border RTL or LTR.
            else if (editor.opts.direction == 'rtl' && second !== 0 || editor.opts.direction != 'rtl' && second === 0) {
                width = (table_width - release_position + initial_positon) / table_width * table_percentage;
                $table.css('margin-left', 'calc(100% - ' + Math.round(width).toFixed(4) + '% - ' + Math.round(right_margin).toFixed(4) + '%)');
              } // Update table width.


            $table.css('width', Math.round(width).toFixed(4) + '%');
          }

        editor.selection.restore();
        editor.undo.saveStep();
        editor.events.trigger('table.resized', [$table.get(0)]);
      } // Clear resizer data.


      $resizer.removeData('origin');
      $resizer.removeData('release-position');
      $resizer.removeData('first');
      $resizer.removeData('second');
      $resizer.removeData('table');
    }
    /*
     * Get the width of the column. (columns may have colspan)
     */


    function _columnWidth(col, map) {
      var i;
      var width = $(map[0][col]).outerWidth();

      for (i = 1; i < map.length; i++) {
        width = Math.min(width, $(map[i][col]).outerWidth());
      }

      return width;
    }
    /*
     * Get the width of the columns between specified indexes.
     */


    function _columnsWidth(col1, col2, map) {
      var i;
      var width = 0; // Sum all columns widths.

      for (i = col1; i <= col2; i++) {
        width += _columnWidth(i, map);
      }

      return width;
    }
    /*
     * Set mouse timer to improve performance.
     */


    function _mouseMove(e) {
      // Prevent selecting text when we have cells selected.
      if (selectedCells().length > 1 && mouseDownFlag) {
        _clearSelection();
      } // Reset or set timer.


      if (mouseDownFlag === false && mouseDownCellFlag === false && resizingFlag === false) {
        if (mouseMoveTimer) {
          clearTimeout(mouseMoveTimer);
        } // Only resize table if the editor is not disabled by user.


        if (!editor.edit.isDisabled() || editor.popups.isVisible('table.edit')) {
          // Check tag under in order to place the table resizer or insert helper button.
          mouseMoveTimer = setTimeout(_tagUnder, 30, e);
        } // Move table resizer.

      } else if (resizingFlag) {
        // Cursor position.
        var pos = e.pageX - editor.win.pageXOffset;

        if (editor.opts.iframe) {
          pos += editor.$iframe.offset().left;
        } // Left and right limits.


        var left_limit = $resizer.data('max-left');
        var right_limit = $resizer.data('max-right'); // Cursor is between the left and right limits.

        if (pos >= left_limit && pos <= right_limit) {
          $resizer.css('left', pos - editor.opts.tableResizerOffset - editor.$wp.offset().left); // Cursor has exceeded the left limit. Don't update if it already has the correct value.
        } else if (pos < left_limit && parseFloat($resizer.css('left'), 10) > left_limit - editor.opts.tableResizerOffset) {
          $resizer.css('left', left_limit - editor.opts.tableResizerOffset - editor.$wp.offset().left); // Cursor has exceeded the right limit. Don't update if it already has the correct value.
        } else if (pos > right_limit && parseFloat($resizer.css('left'), 10) < right_limit - editor.opts.tableResizerOffset) {
          $resizer.css('left', right_limit - editor.opts.tableResizerOffset - editor.$wp.offset().left);
        }
      } else if (mouseDownFlag) {
        _hideInsertHelper();
      }
    }
    /*
     * Place selection markers in a table cell.
     */


    function _addMarkersInCell($cell) {
      if (editor.node.isEmpty($cell.get(0))) {
        $cell.prepend(FE.MARKERS);
      } else {
        $cell.prepend(FE.START_MARKER).append(FE.END_MARKER);
      }
    }
    /*
     * Use TAB key to navigate through cells.
     */


    function _useTab(e) {
      var key_code = e.which;

      if (key_code == FE.KEYCODE.TAB) {
        // Get starting cell.
        var $cell;

        if (selectedCells().length > 0) {
          $cell = editor.$el.find('.fr-selected-cell').last();
        } else {
          var cell = editor.selection.element();

          if (cell.tagName == 'TD' || cell.tagName == 'TH') {
            $cell = $(cell);
          } else if (cell != editor.el) {
            if ($(cell).parentsUntil(editor.$el, 'td').length > 0) {
              $cell = $(cell).parents('td').first();
            } else if ($(cell).parentsUntil(editor.$el, 'th').length > 0) {
              $cell = $(cell).parents('th').first();
            }
          }
        }

        if ($cell) {
          e.preventDefault();
          var currentSelection = editor.selection.get();

          if (currentSelection.focusOffset === 0 && $(editor.selection.element()).parentsUntil(editor.$el, 'ol, ul').length > 0 && ($(editor.selection.element()).closest('li').prev().length > 0 || $(editor.selection.element()).is('li') && $(editor.selection.element()).prev().length > 0)) {
            return true;
          }

          _stopEdit(); // Go backwards.


          if (e.shiftKey) {
            // Go to previous cell.
            if ($cell.prev().length > 0) {
              _addMarkersInCell($cell.prev());
            } // Go to prev row, last cell.
            else if ($cell.closest('tr').length > 0 && $cell.closest('tr').prev().length > 0) {
                _addMarkersInCell($cell.closest('tr').prev().find('td').last());
              } // Go in THEAD, last cell.
              else if ($cell.closest('tbody').length > 0 && $cell.closest('table').find('thead tr').length > 0) {
                  _addMarkersInCell($cell.closest('table').find('thead tr th').last());
                }
          } // Go forward.
          else {
              // Go to next cell.
              if ($cell.next().length > 0) {
                _addMarkersInCell($cell.next());
              } // Go to next row, first cell.
              else if ($cell.closest('tr').length > 0 && $cell.closest('tr').next().length > 0) {
                  _addMarkersInCell($cell.closest('tr').next().find('td').first());
                } // Cursor is in THEAD. Go to next row in TBODY
                else if ($cell.closest('thead').length > 0 && $cell.closest('table').find('tbody tr').length > 0) {
                    _addMarkersInCell($cell.closest('table').find('tbody tr td').first());
                  } // Add new row.
                  else {
                      $cell.addClass('fr-selected-cell');
                      insertRow('below');

                      _removeSelection();

                      _addMarkersInCell($cell.closest('tr').next().find('td').first());
                    }
            } // Update cursor position.


          editor.selection.restore(); // Prevent event propagation.

          return false;
        }
      }
    }
    /*
     * Initilize insert helper.
     */


    function _initInsertHelper() {
      // Append insert helper HTML to editor wrapper.
      if (!editor.shared.$ti_helper) {
        editor.shared.$ti_helper = $(document.createElement('div')).attr('class', 'fr-insert-helper').html('<a class="fr-floating-btn" role="button" tabIndex="-1" title="' + editor.language.translate('Insert') + '"><svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M22,16.75 L16.75,16.75 L16.75,22 L15.25,22.000 L15.25,16.75 L10,16.75 L10,15.25 L15.25,15.25 L15.25,10 L16.75,10 L16.75,15.25 L22,15.25 L22,16.75 Z"/></svg></a>'); // Click on insert helper.

        editor.events.bindClick(editor.shared.$ti_helper, 'a', function () {
          var $td = $insert_helper.data('selected-cell');
          var position = $insert_helper.data('position');
          var inst = $insert_helper.data('instance') || editor;

          if (position == 'before') {
            editor.undo.saveStep();
            $td.addClass('fr-selected-cell');
            inst.table.insertColumn(position);
            $td.removeClass('fr-selected-cell');
            editor.undo.saveStep();
          } else if (position == 'after') {
            editor.undo.saveStep();
            $td.addClass('fr-selected-cell');
            inst.table.insertColumn(position);
            $td.removeClass('fr-selected-cell');
            editor.undo.saveStep();
          } else if (position == 'above') {
            editor.undo.saveStep();
            $td.addClass('fr-selected-cell');
            inst.table.insertRow(position);
            $td.removeClass('fr-selected-cell');
            editor.undo.saveStep();
          } else if (position == 'below') {
            editor.undo.saveStep();
            $td.addClass('fr-selected-cell');
            inst.table.insertRow(position);
            $td.removeClass('fr-selected-cell');
            editor.undo.saveStep();
          } // Hide the insert helper so it will reposition.


          _hideInsertHelper();
        }); // Editor destroy.

        editor.events.on('shared.destroy', function () {
          editor.shared.$ti_helper.html('').removeData().remove();
          editor.shared.$ti_helper = null;
        }, true); // Prevent the insert helper hide when mouse is over it.

        editor.events.$on(editor.shared.$ti_helper, 'mousemove', function (e) {
          e.stopPropagation();
        }, true); // Hide the insert helper if the page is scrolled.

        editor.events.$on($(editor.o_win), 'scroll', function () {
          _hideInsertHelper();
        }, true);
        editor.events.$on(editor.$wp, 'scroll', function () {
          _hideInsertHelper();
        }, true);
      }

      $insert_helper = editor.shared.$ti_helper;
      editor.events.on('destroy', function () {
        $insert_helper = null;
      }); // Table insert helper tooltip.

      editor.tooltip.bind(editor.$box, '.fr-insert-helper > a.fr-floating-btn');
    }
    /**
     * Destroy
     */


    function _destroy() {
      mouseDownCell = null;
      clearTimeout(mouseMoveTimer);
    }
    /*
     * Go back to the table edit popup.
     */


    function back() {
      if (selectedCells().length > 0) {
        _showEditPopup();
      } else {
        editor.popups.hide('table.insert');
        editor.toolbar.showInline();
      }
    }
    /**
     * Return selected cells.
     */


    function selectedCells() {
      return editor.el.querySelectorAll('.fr-selected-cell');
    }
    /**
     * Return selected table.
     */


    function selectedTable() {
      var cells = selectedCells();

      if (cells.length) {
        var cell = cells[0];

        while (cell && cell.tagName != 'TABLE' && cell.parentNode != editor.el) {
          cell = cell.parentNode;
        }

        if (cell && cell.tagName == 'TABLE') return $(cell);
        return $([]);
      }

      return $([]);
    }
    /**
     * Select table cell with alt + space.
     */


    function _selectCellWithKeyboard(e) {
      // Alt+space was hit. Try to select cell.
      if (e.altKey && e.which == FE.KEYCODE.SPACE) {
        var cell;
        var el = editor.selection.element(); // Get cell where cursor is.

        if (el.tagName == 'TD' || el.tagName == 'TH') {
          cell = el;
        } else if ($(el).closest('td').length > 0) {
          cell = $(el).closest('td').get(0);
        } else if ($(el).closest('th').length > 0) {
          cell = $(el).closest('th').get(0);
        } // Select this cell.


        if (cell) {
          e.preventDefault();
          selectCells(cell, cell);

          _showEditPopup();

          return false;
        }
      }
    }
    /**
     * Select table cells using arrows.
     */


    function selectCellsWithKeyboard(e) {
      var selection = selectedCells(); // Return if no selected cell

      if (selection == null) {
        return;
      } // There are some selected cells.


      if (selection.length > 0) {
        var map = _tableMap();

        var key_code = e.which;
        var fixedCell;
        var handlerCell; // Only one cell is selected.

        if (selection.length == 1) {
          fixedCell = selection[0];
          handlerCell = fixedCell;
        } else {
          fixedCell = editor.el.querySelector('.fr-cell-fixed');
          handlerCell = editor.el.querySelector('.fr-cell-handler');
        }

        var handlerOrigin = _cellOrigin(handlerCell, map); // Select column at the right.


        if (FE.KEYCODE.ARROW_RIGHT == key_code) {
          if (handlerOrigin.col < map[0].length - 1) {
            selectCells(fixedCell, map[handlerOrigin.row][handlerOrigin.col + 1]);
            return false;
          }
        } // Select row below.
        else if (FE.KEYCODE.ARROW_DOWN == key_code) {
            if (handlerOrigin.row < map.length - 1) {
              selectCells(fixedCell, map[handlerOrigin.row + 1][handlerOrigin.col]);
              return false;
            }
          } // Select column at the left.
          else if (FE.KEYCODE.ARROW_LEFT == key_code) {
              if (handlerOrigin.col > 0) {
                selectCells(fixedCell, map[handlerOrigin.row][handlerOrigin.col - 1]);
                return false;
              }
            } // Select row above.
            else if (FE.KEYCODE.ARROW_UP == key_code) {
                if (handlerOrigin.row > 0) {
                  selectCells(fixedCell, map[handlerOrigin.row - 1][handlerOrigin.col]);
                  return false;
                }
              }
      }
    }
    /*
     * Init table.
     */


    function _init() {
      if (!editor.$wp) return false; // Do cell selection only on desktops (no touch devices)

      if (!editor.helpers.isMobile()) {
        // Remember if mouse is clicked.
        mouseDownFlag = false;
        mouseDownCellFlag = false;
        resizingFlag = false; // Mouse is down in a table cell.

        editor.events.$on(editor.$el, 'mousedown', _mouseDown); // Deselect table cells when user clicks on an image.

        editor.popups.onShow('image.edit', function () {
          _removeSelection();

          mouseDownFlag = false;
          mouseDownCellFlag = false;
        }); // Deselect table cells when user clicks on a link.

        editor.popups.onShow('link.edit', function () {
          _removeSelection();

          mouseDownFlag = false;
          mouseDownCellFlag = false;
        }); // Deselect table cells when a command is run.

        editor.events.on('commands.mousedown', function ($btn) {
          if ($btn.parents('.fr-toolbar').length > 0) {
            _removeSelection();
          }
        }); // Mouse enter's a table cell.

        editor.events.$on(editor.$el, 'mouseover', 'th, td', _mouseEnter); // Mouse is no longer pressed.

        editor.events.$on(editor.$win, 'mouseup', _mouseUp); // Iframe mouseup.

        if (editor.opts.iframe) {
          editor.events.$on($(editor.o_win), 'mouseup', _mouseUp);
        } // Check tags under the mouse to see if the resizer needs to be shown.


        editor.events.$on(editor.$win, 'mousemove', _mouseMove); // Update resizer's position on scroll.

        editor.events.$on($(editor.o_win), 'scroll', _repositionResizer); // Reposition table edit popup when table cell content changes.

        editor.events.on('contentChanged', function () {
          if (selectedCells().length > 0) {
            _showEditPopup(); // Make sure we reposition on image load.


            editor.$el.find('img').on('load.selected-cells', function () {
              $(this).off('load.selected-cells');

              if (selectedCells().length > 0) {
                _showEditPopup();
              }
            });
          }
        }); // Reposition table edit popup on window resize.

        editor.events.$on($(editor.o_win), 'resize', function () {
          _removeSelection();
        });
        editor.events.on('toolbar.esc', function () {
          if (selectedCells().length > 0) {
            editor.events.disableBlur();
            editor.events.focus();
            return false;
          }
        }, true); // Allow keyboard while selecting table cells.
        // https://github.com/froala/wysiwyg-editor/issues/2256

        editor.events.$on($(editor.o_win), 'keydown', function () {
          if (mouseDownFlag && mouseDownCellFlag) {
            mouseDownFlag = false;
            mouseDownCellFlag = false; // Allow text selection.

            editor.$el.removeClass('fr-no-selection');
            editor.edit.on();
            editor.selection.setAtEnd(editor.$el.find('.fr-selected-cell').last().get(0));
            editor.selection.restore(); // Remove selected cells.

            _removeSelection();
          }
        }); // Selecting cells with keyboard or moving cursor with arrow keys.

        editor.events.$on(editor.$el, 'keydown', function (e) {
          if (e.shiftKey) {
            if (selectCellsWithKeyboard(e) === false) {
              // Timeout needed due to clearSelection timeout.
              setTimeout(function () {
                _showEditPopup();
              }, 0);
            }
          } else {
            _navigateWithArrows(e);
          }
        }); // Prevent backspace from doing browser back.

        editor.events.on('keydown', function (e) {
          // Tab in cell.
          if (_useTab(e) === false) return false;
          var selected_cells = selectedCells();

          if (selected_cells.length > 0) {
            // CMD + A clear table cell selection and allow propagation.
            if (selected_cells.length > 0 && editor.keys.ctrlKey(e) && e.which == FE.KEYCODE.A) {
              _removeSelection();

              if (editor.popups.isVisible('table.edit')) {
                editor.popups.hide('table.edit');
              }

              selected_cells = [];
              return true;
            } // ESC clear table cell selection.


            if (e.which == FE.KEYCODE.ESC) {
              if (editor.popups.isVisible('table.edit')) {
                _removeSelection();

                editor.popups.hide('table.edit');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                selected_cells = [];
                return false;
              }
            } // Backspace clears selected cells content.


            if (selected_cells.length > 1 && (e.which == FE.KEYCODE.BACKSPACE || e.which == FE.KEYCODE.DELETE)) {
              editor.undo.saveStep();

              for (var i = 0; i < selected_cells.length; i++) {
                $(selected_cells[i]).html('<br>');

                if (i == selected_cells.length - 1) {
                  $(selected_cells[i]).prepend(FE.MARKERS);
                }
              }

              editor.selection.restore();
              editor.undo.saveStep();
              selected_cells = [];
              return false;
            } // Prevent typing if cells are selected. (Allow browser refresh using keyboard)


            if (selected_cells.length > 1 && e.which != FE.KEYCODE.F10 && !editor.keys.isBrowserAction(e)) {
              e.preventDefault();
              selected_cells = [];
              return false;
            }
          } // We may want to select a cell with keyboard.
          else {
              // Garbage collector.
              selected_cells = [];
              if (_selectCellWithKeyboard(e) === false) return false;
            }
        }, true); // Clean selected cells.

        var c_selected_cells = [];
        editor.events.on('html.beforeGet', function () {
          c_selected_cells = selectedCells();

          for (var i = 0; i < c_selected_cells.length; i++) {
            c_selected_cells[i].className = (c_selected_cells[i].className || '').replace(/fr-selected-cell/g, '');
          }
        });
        editor.events.on('html.afterGet', function () {
          for (var i = 0; i < c_selected_cells.length; i++) {
            c_selected_cells[i].className = (c_selected_cells[i].className ? c_selected_cells[i].className.trim() + ' ' : '') + 'fr-selected-cell';
          }

          c_selected_cells = [];
        });

        _initInsertPopup(true);

        _initEditPopup(true);
      }

      editor.events.on('destroy', _destroy);
    }

    return {
      _init: _init,
      insert: insert,
      remove: remove,
      insertRow: insertRow,
      deleteRow: deleteRow,
      insertColumn: insertColumn,
      deleteColumn: deleteColumn,
      mergeCells: mergeCells,
      splitCellVertically: splitCellVertically,
      splitCellHorizontally: splitCellHorizontally,
      addHeader: addHeader,
      removeHeader: removeHeader,
      setBackground: setBackground,
      showInsertPopup: _showInsertPopup,
      showEditPopup: _showEditPopup,
      showColorsPopup: _showColorsPopup,
      back: back,
      verticalAlign: verticalAlign,
      horizontalAlign: horizontalAlign,
      applyStyle: applyStyle,
      selectedTable: selectedTable,
      selectedCells: selectedCells,
      customColor: customColor,
      selectCells: selectCells
    };
  }; // Insert table button.


  FE.DefineIcon('insertTable', {
    NAME: 'table',
    SVG_KEY: 'insertTable'
  });
  FE.RegisterCommand('insertTable', {
    title: 'Insert Table',
    undo: false,
    focus: true,
    refreshOnCallback: false,
    popup: true,
    callback: function callback() {
      if (!this.popups.isVisible('table.insert')) {
        this.table.showInsertPopup();
      } else {
        if (this.$el.find('.fr-marker').length) {
          this.events.disableBlur();
          this.selection.restore();
        }

        this.popups.hide('table.insert');
      }
    },
    plugin: 'table'
  });
  FE.RegisterCommand('tableInsert', {
    callback: function callback(cmd, rows, cols) {
      this.table.insert(rows, cols);
      this.popups.hide('table.insert');
    }
  }); // Table header button.

  FE.DefineIcon('tableHeader', {
    NAME: 'header',
    FA5NAME: 'heading',
    SVG_KEY: 'tableHeader'
  });
  FE.RegisterCommand('tableHeader', {
    title: 'Table Header',
    focus: false,
    toggle: true,
    callback: function callback() {
      var $btn = this.popups.get('table.edit').find('.fr-command[data-cmd="tableHeader"]'); // If button is active the table has a header,

      if ($btn.hasClass('fr-active')) {
        this.table.removeHeader();
      } // Add table header.
      else {
          this.table.addHeader();
        }
    },
    refresh: function refresh($btn) {
      var $table = this.table.selectedTable();

      if ($table.length > 0) {
        // If table doesn't have a header.
        if ($table.find('th').length === 0) {
          $btn.removeClass('fr-active').attr('aria-pressed', false);
        } // Header button is active if table has header.
        else {
            $btn.addClass('fr-active').attr('aria-pressed', true);
          }
      }
    }
  }); // Table rows action dropdown.

  FE.DefineIcon('tableRows', {
    NAME: 'bars',
    SVG_KEY: 'row'
  });
  FE.RegisterCommand('tableRows', {
    type: 'dropdown',
    focus: false,
    title: 'Row',
    options: {
      above: 'Insert row above',
      below: 'Insert row below',
      'delete': 'Delete row'
    },
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = FE.COMMANDS.tableRows.options;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          c += '<li role="presentation"><a class="fr-command" tabIndex="-1" role="option" data-cmd="tableRows" data-param1="' + val + '" title="' + this.language.translate(options[val]) + '">' + this.language.translate(options[val]) + '</a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      if (val == 'above' || val == 'below') {
        this.table.insertRow(val);
      } else {
        this.table.deleteRow();
      }
    }
  }); // Table columns action dropdown.

  FE.DefineIcon('tableColumns', {
    NAME: 'bars fa-rotate-90',
    SVG_KEY: 'columns'
  });
  FE.RegisterCommand('tableColumns', {
    type: 'dropdown',
    focus: false,
    title: 'Column',
    options: {
      before: 'Insert column before',
      after: 'Insert column after',
      'delete': 'Delete column'
    },
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = FE.COMMANDS.tableColumns.options;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          c += '<li role="presentation"><a class="fr-command" tabIndex="-1" role="option" data-cmd="tableColumns" data-param1="' + val + '" title="' + this.language.translate(options[val]) + '">' + this.language.translate(options[val]) + '</a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      if (val == 'before' || val == 'after') {
        this.table.insertColumn(val);
      } else {
        this.table.deleteColumn();
      }
    }
  }); // Table cells action dropdown.

  FE.DefineIcon('tableCells', {
    NAME: 'square-o',
    FA5NAME: 'square',
    SVG_KEY: 'cellOptions'
  });
  FE.RegisterCommand('tableCells', {
    type: 'dropdown',
    focus: false,
    title: 'Cell',
    options: {
      merge: 'Merge cells',
      'vertical-split': 'Vertical split',
      'horizontal-split': 'Horizontal split'
    },
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = FE.COMMANDS.tableCells.options;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          c += '<li role="presentation"><a class="fr-command" tabIndex="-1" role="option" data-cmd="tableCells" data-param1="' + val + '" title="' + this.language.translate(options[val]) + '">' + this.language.translate(options[val]) + '</a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      if (val == 'merge') {
        this.table.mergeCells();
      } else if (val == 'vertical-split') {
        this.table.splitCellVertically();
      } // 'horizontal-split'
      else {
          this.table.splitCellHorizontally();
        }
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      // More than one cell selected.
      if (this.$el.find('.fr-selected-cell').length > 1) {
        $dropdown.find('a[data-param1="vertical-split"]').addClass('fr-disabled').attr('aria-disabled', true);
        $dropdown.find('a[data-param1="horizontal-split"]').addClass('fr-disabled').attr('aria-disabled', true);
        $dropdown.find('a[data-param1="merge"]').removeClass('fr-disabled').attr('aria-disabled', false);
      } // Only one selected cell.
      else {
          $dropdown.find('a[data-param1="merge"]').addClass('fr-disabled').attr('aria-disabled', true);
          $dropdown.find('a[data-param1="vertical-split"]').removeClass('fr-disabled').attr('aria-disabled', false);
          $dropdown.find('a[data-param1="horizontal-split"]').removeClass('fr-disabled').attr('aria-disabled', false);
        }
    }
  }); // Remove table button.

  FE.DefineIcon('tableRemove', {
    NAME: 'trash',
    SVG_KEY: 'removeTable'
  });
  FE.RegisterCommand('tableRemove', {
    title: 'Remove Table',
    focus: false,
    callback: function callback() {
      this.table.remove();
    }
  }); // Table styles.

  FE.DefineIcon('tableStyle', {
    NAME: 'paint-brush',
    SVG_KEY: 'tableStyle'
  });
  FE.RegisterCommand('tableStyle', {
    title: 'Table Style',
    type: 'dropdown',
    focus: false,
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = this.opts.tableStyles;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          c += '<li role="presentation"><a class="fr-command" tabIndex="-1" role="option" data-cmd="tableStyle" data-param1="' + val + '" title="' + this.language.translate(options[val]) + '">' + this.language.translate(options[val]) + '</a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      this.table.applyStyle(val, this.$el.find('.fr-selected-cell').closest('table'), this.opts.tableMultipleStyles, this.opts.tableStyles);
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      var $ = this.$;
      var $table = this.$el.find('.fr-selected-cell').closest('table');

      if ($table) {
        $dropdown.find('.fr-command').each(function () {
          var cls = $(this).data('param1');
          var active = $table.hasClass(cls);
          $(this).toggleClass('fr-active', active).attr('aria-selected', active);
        });
      }
    }
  }); // Table cell background color button.

  FE.DefineIcon('tableCellBackground', {
    NAME: 'tint',
    SVG_KEY: 'cellBackground'
  });
  FE.RegisterCommand('tableCellBackground', {
    title: 'Cell Background',
    focus: false,
    popup: true,
    callback: function callback() {
      this.table.showColorsPopup();
    }
  }); // Select table cell background color command.

  FE.RegisterCommand('tableCellBackgroundColor', {
    undo: true,
    focus: false,
    callback: function callback(cmd, val) {
      this.table.setBackground(val);
    }
  }); // Table back.

  FE.DefineIcon('tableBack', {
    NAME: 'arrow-left',
    SVG_KEY: 'back'
  });
  FE.RegisterCommand('tableBack', {
    title: 'Back',
    undo: false,
    focus: false,
    back: true,
    callback: function callback() {
      this.table.back();
    },
    refresh: function refresh($btn) {
      if (this.table.selectedCells().length === 0 && !this.opts.toolbarInline) {
        $btn.addClass('fr-hidden');
        $btn.next('.fr-separator').addClass('fr-hidden');
      } else {
        $btn.removeClass('fr-hidden');
        $btn.next('.fr-separator').removeClass('fr-hidden');
      }
    }
  }); // Table vertical align dropdown.

  FE.DefineIcon('tableCellVerticalAlign', {
    NAME: 'arrows-v',
    FA5NAME: 'arrows-alt-v',
    SVG_KEY: 'verticalAlignMiddle'
  });
  FE.RegisterCommand('tableCellVerticalAlign', {
    type: 'dropdown',
    focus: false,
    title: 'Vertical Align',
    options: {
      Top: 'Align Top',
      Middle: 'Align Middle',
      Bottom: 'Align Bottom'
    },
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = FE.COMMANDS.tableCellVerticalAlign.options;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          c += '<li role="presentation"><a class="fr-command" tabIndex="-1" role="option" data-cmd="tableCellVerticalAlign" data-param1="' + val.toLowerCase() + '" title="' + this.language.translate(options[val]) + '">' + this.language.translate(val) + '</a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      this.table.verticalAlign(val);
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      $dropdown.find('.fr-command[data-param1="' + this.$el.find('.fr-selected-cell').css('vertical-align') + '"]').addClass('fr-active').attr('aria-selected', true);
    }
  }); // Table horizontal align dropdown.

  FE.DefineIcon('tableCellHorizontalAlign', {
    NAME: 'align-left',
    SVG_KEY: 'alignLeft'
  });
  FE.DefineIcon('align-left', {
    NAME: 'align-left',
    SVG_KEY: 'alignLeft'
  });
  FE.DefineIcon('align-right', {
    NAME: 'align-right',
    SVG_KEY: 'alignRight'
  });
  FE.DefineIcon('align-center', {
    NAME: 'align-center',
    SVG_KEY: 'alignCenter'
  });
  FE.DefineIcon('align-justify', {
    NAME: 'align-justify',
    SVG_KEY: 'alignJustify'
  });
  FE.RegisterCommand('tableCellHorizontalAlign', {
    type: 'dropdown',
    focus: false,
    title: 'Horizontal Align',
    options: {
      left: 'Align Left',
      center: 'Align Center',
      right: 'Align Right',
      justify: 'Align Justify'
    },
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = FE.COMMANDS.tableCellHorizontalAlign.options;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          c += '<li role="presentation"><a class="fr-command fr-title" tabIndex="-1" role="option" data-cmd="tableCellHorizontalAlign" data-param1="' + val + '" title="' + this.language.translate(options[val]) + '">' + this.icon.create('align-' + val) + '<span class="fr-sr-only">' + this.language.translate(options[val]) + '</span></a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      this.table.horizontalAlign(val);
    },
    refresh: function refresh($btn) {
      var selected_cells = this.table.selectedCells();
      var $ = this.$;

      if (selected_cells.length) {
        $btn.find('> *').first().replaceWith(this.icon.create('align-' + this.helpers.getAlignment($(selected_cells[0]))));
      }
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      $dropdown.find('.fr-command[data-param1="' + this.helpers.getAlignment(this.$el.find('.fr-selected-cell').first()) + '"]').addClass('fr-active').attr('aria-selected', true);
    }
  }); // Table cell styles.

  FE.DefineIcon('tableCellStyle', {
    NAME: 'magic',
    SVG_KEY: 'cellStyle'
  });
  FE.RegisterCommand('tableCellStyle', {
    title: 'Cell Style',
    type: 'dropdown',
    focus: false,
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = this.opts.tableCellStyles;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          c += '<li role="presentation"><a class="fr-command" tabIndex="-1" role="option" data-cmd="tableCellStyle" data-param1="' + val + '" title="' + this.language.translate(options[val]) + '">' + this.language.translate(options[val]) + '</a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      this.table.applyStyle(val, this.$el.find('.fr-selected-cell'), this.opts.tableCellMultipleStyles, this.opts.tableCellStyles);
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      var $ = this.$;
      var $cell = this.$el.find('.fr-selected-cell').first();

      if ($cell) {
        $dropdown.find('.fr-command').each(function () {
          var cls = $(this).data('param1');
          var active = $cell.hasClass(cls);
          $(this).toggleClass('fr-active', active).attr('aria-selected', active);
        });
      }
    }
  });
  FE.RegisterCommand('tableCellBackgroundCustomColor', {
    title: 'OK',
    undo: true,
    callback: function callback() {
      this.table.customColor();
    }
  });
  FE.DefineIcon('tableColorRemove', {
    NAME: 'eraser',
    SVG_KEY: 'remove'
  });

  FE.URLRegEx = "(^| |\\u00A0)(" + FE.LinkRegEx + '|' + '([a-z0-9+-_.]{1,}@[a-z0-9+-_.]{1,}\\.[a-z0-9+\-_]{1,})' + ')$';

  FE.PLUGINS.url = function (editor) {
    var $ = editor.$;
    var rel = null;
    /*
     * Transform string into a hyperlink.
     */

    function _linkReplaceHandler(match, p1, p2) {
      var dots = '';

      while (p2.length && p2[p2.length - 1] == '.') {
        dots += '.';
        p2 = p2.substring(0, p2.length - 1);
      }

      var link = p2; // Convert email.

      if (editor.opts.linkConvertEmailAddress) {
        if (editor.helpers.isEmail(link) && !/^mailto:.*/i.test(link)) {
          link = 'mailto:' + link;
        }
      } else if (editor.helpers.isEmail(link)) {
        return p1 + p2;
      }

      if (!/^((http|https|ftp|ftps|mailto|tel|sms|notes|data)\:)/i.test(link)) {
        link = '//' + link;
      }

      return (p1 ? p1 : '') + '<a' + (editor.opts.linkAlwaysBlank ? ' target="_blank"' : '') + (rel ? ' rel="' + rel + '"' : '') + ' data-fr-linked="true" href="' + link + '">' + p2.replace(/&amp;/g, '&').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</a>' + dots;
    }

    function _getRegEx() {
      return new RegExp(FE.URLRegEx, 'gi');
    }
    /*
     * Convert link paterns from html into hyperlinks.
     */


    function _convertToLink(html) {
      if (editor.opts.linkAlwaysNoFollow) {
        rel = 'nofollow';
      } // https://github.com/froala/wysiwyg-editor/issues/1576.


      if (editor.opts.linkAlwaysBlank) {
        if (editor.opts.linkNoOpener) {
          if (!rel) rel = 'noopener';else rel += ' noopener';
        }

        if (editor.opts.linkNoReferrer) {
          if (!rel) rel = 'noreferrer';else rel += ' noreferrer';
        }
      }

      return html.replace(_getRegEx(), _linkReplaceHandler);
    }

    function _isA(node) {
      if (!node) return false;
      if (node.tagName === 'A') return true;
      if (node.parentNode && node.parentNode != editor.el) return _isA(node.parentNode);
      return false;
    }

    function _lastPart(text) {
      var splits = text.split(' ');
      return splits[splits.length - 1];
    }

    function _inlineType() {
      var range = editor.selection.ranges(0);
      var node = range.startContainer;
      if (!node || node.nodeType !== Node.TEXT_NODE || range.startOffset !== (node.textContent || '').length) return false;
      if (_isA(node)) return false;

      if (_getRegEx().test(_lastPart(node.textContent))) {
        $(node).before(_convertToLink(node.textContent)); // Get linked link.

        var $link = $(node.parentNode).find('a[data-fr-linked]');
        $link.removeAttr('data-fr-linked');
        node.parentNode.removeChild(node); // Trigger link event.

        editor.events.trigger('url.linked', [$link.get(0)]);
      } else if (node.textContent.split(' ').length <= 2 && node.previousSibling && node.previousSibling.tagName === 'A') {
        var text = node.previousSibling.innerText + node.textContent;

        if (_getRegEx().test(_lastPart(text))) {
          $(node.previousSibling).replaceWith(_convertToLink(text));
          node.parentNode.removeChild(node);
        }
      }
    }
    /*
     * Initialize.
     */


    function _init() {
      // Handle special keys.
      editor.events.on('keypress', function (e) {
        if (editor.selection.isCollapsed() && (e.key == '.' || e.key == ')' || e.key == '(')) {
          _inlineType();
        }
      }, true); // Handle ENTER and SPACE.

      editor.events.on('keydown', function (e) {
        var keycode = e.which;

        if (editor.selection.isCollapsed() && (keycode == FE.KEYCODE.ENTER || keycode == FE.KEYCODE.SPACE)) {
          _inlineType();
        }
      }, true); // Handle pasting.

      editor.events.on('paste.beforeCleanup', function (html) {
        if (editor.helpers.isURL(html)) {
          var rel_attr = null;

          if (editor.opts.linkAlwaysBlank) {
            if (editor.opts.linkNoOpener) {
              if (!rel_attr) rel_attr = 'noopener';else rel_attr += ' noopener';
            }

            if (editor.opts.linkNoReferrer) {
              if (!rel_attr) rel_attr = 'noreferrer';else rel_attr += ' noreferrer';
            }
          }

          return '<a' + (editor.opts.linkAlwaysBlank ? ' target="_blank"' : '') + (rel_attr ? ' rel="' + rel_attr + '"' : '') + ' href="' + html + '" >' + html + '</a>';
        }
      });
    }

    return {
      _init: _init
    };
  };

  Object.assign(FE.POPUP_TEMPLATES, {
    'video.insert': '[_BUTTONS_][_BY_URL_LAYER_][_EMBED_LAYER_][_UPLOAD_LAYER_][_PROGRESS_BAR_]',
    'video.edit': '[_BUTTONS_]',
    'video.size': '[_BUTTONS_][_SIZE_LAYER_]'
  });
  Object.assign(FE.DEFAULTS, {
    videoAllowedTypes: ['mp4', 'webm', 'ogg'],
    videoAllowedProviders: ['.*'],
    videoDefaultAlign: 'center',
    videoDefaultDisplay: 'block',
    videoDefaultWidth: 600,
    videoEditButtons: ['videoReplace', 'videoRemove', 'videoDisplay', 'videoAlign', 'videoSize'],
    videoInsertButtons: ['videoBack', '|', 'videoByURL', 'videoEmbed', 'videoUpload'],
    videoMaxSize: 50 * 1024 * 1024,
    videoMove: true,
    videoResize: true,
    videoResponsive: false,
    videoSizeButtons: ['videoBack', '|'],
    videoSplitHTML: false,
    videoTextNear: true,
    videoUpload: true,
    videoUploadMethod: 'POST',
    videoUploadParam: 'file',
    videoUploadParams: {},
    videoUploadToS3: false,
    videoUploadURL: null
  });
  FE.VIDEO_PROVIDERS = [{
    test_regex: /^.*((youtu.be)|(youtube.com))\/((v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))?\??v?=?([^#\&\?]*).*/,
    url_regex: /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/)?([0-9a-zA-Z_\-]+)(.+)?/g,
    url_text: 'https://www.youtube.com/embed/$1?$2',
    html: '<iframe width="640" height="360" src="{url}&wmode=opaque" frameborder="0" allowfullscreen></iframe>',
    provider: 'youtube'
  }, {
    test_regex: /^.*(?:vimeo.com)\/(?:channels(\/\w+\/)?|groups\/*\/videos\/​\d+\/|video\/|)(\d+)(?:$|\/|\?)/,
    url_regex: /(?:https?:\/\/)?(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?(\/[a-zA-Z0-9_\-]+)?/i,
    url_text: 'https://player.vimeo.com/video/$1',
    html: '<iframe width="640" height="360" src="{url}" frameborder="0" allowfullscreen></iframe>',
    provider: 'vimeo'
  }, {
    test_regex: /^.+(dailymotion.com|dai.ly)\/(video|hub)?\/?([^_]+)[^#]*(#video=([^_&]+))?/,
    url_regex: /(?:https?:\/\/)?(?:www\.)?(?:dailymotion\.com|dai\.ly)\/(?:video|hub)?\/?(.+)/g,
    url_text: 'https://www.dailymotion.com/embed/video/$1',
    html: '<iframe width="640" height="360" src="{url}" frameborder="0" allowfullscreen></iframe>',
    provider: 'dailymotion'
  }, {
    test_regex: /^.+(screen.yahoo.com)\/[^_&]+/,
    url_regex: '',
    url_text: '',
    html: '<iframe width="640" height="360" src="{url}?format=embed" frameborder="0" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true" allowtransparency="true"></iframe>',
    provider: 'yahoo'
  }, {
    test_regex: /^.+(rutube.ru)\/[^_&]+/,
    url_regex: /(?:https?:\/\/)?(?:www\.)?(?:rutube\.ru)\/(?:video)?\/?(.+)/g,
    url_text: 'https://rutube.ru/play/embed/$1',
    html: '<iframe width="640" height="360" src="{url}" frameborder="0" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true" allowtransparency="true"></iframe>',
    provider: 'rutube'
  }, {
    test_regex: /^(?:.+)vidyard.com\/(?:watch)?\/?([^.&/]+)\/?(?:[^_.&]+)?/,
    url_regex: /^(?:.+)vidyard.com\/(?:watch)?\/?([^.&/]+)\/?(?:[^_.&]+)?/g,
    url_text: 'https://play.vidyard.com/$1',
    html: '<iframe width="640" height="360" src="{url}" frameborder="0" allowfullscreen></iframe>',
    provider: 'vidyard'
  }];
  FE.VIDEO_EMBED_REGEX = /^\W*((<iframe(.|\n)*>(\s|\n)*<\/iframe>)|(<embed(.|\n)*>))\W*$/i;

  FE.PLUGINS.video = function (editor) {
    var $ = editor.$;
    var DEFAULT_VIDEO_UPLOAD_URL = 'https://i.froala.com/upload';
    var $overlay;
    var $handler;
    var $video_resizer;
    var $current_video;
    var BAD_LINK = 1;
    var MISSING_LINK = 2;
    var ERROR_DURING_UPLOAD = 3;
    var BAD_RESPONSE = 4;
    var MAX_SIZE_EXCEEDED = 5;
    var BAD_FILE_TYPE = 6;
    var NO_CORS_IE = 7;
    var error_messages = {};
    error_messages[BAD_LINK] = 'Video cannot be loaded from the passed link.', error_messages[MISSING_LINK] = 'No link in upload response.', error_messages[ERROR_DURING_UPLOAD] = 'Error during file upload.', error_messages[BAD_RESPONSE] = 'Parsing response failed.', error_messages[MAX_SIZE_EXCEEDED] = 'File is too large.', error_messages[BAD_FILE_TYPE] = 'Video file type is invalid.', error_messages[NO_CORS_IE] = 'Files can be uploaded only to same domain in IE 8 and IE 9.';
    /**
     * Refresh the video insert popup.
     */

    function _refreshInsertPopup() {
      var $popup = editor.popups.get('video.insert');
      var $url_input = $popup.find('.fr-video-by-url-layer input');
      $url_input.val('').trigger('change');
      var $embed_area = $popup.find('.fr-video-embed-layer textarea');
      $embed_area.val('').trigger('change');
      $embed_area = $popup.find('.fr-video-upload-layer input');
      $embed_area.val('').trigger('change');
    }
    /**
     * Show the video insert popup.
     */


    function showInsertPopup() {
      var $btn = editor.$tb.find('.fr-command[data-cmd="insertVideo"]');
      var $popup = editor.popups.get('video.insert');
      if (!$popup) $popup = _initInsertPopup();
      hideProgressBar();

      if (!$popup.hasClass('fr-active')) {
        editor.popups.refresh('video.insert');
        editor.popups.setContainer('video.insert', editor.$tb);

        if ($btn.isVisible()) {
          var _editor$button$getPos = editor.button.getPosition($btn),
              left = _editor$button$getPos.left,
              top = _editor$button$getPos.top;

          editor.popups.show('video.insert', left, top, $btn.outerHeight());
        } else {
          editor.position.forSelection($popup);
          editor.popups.show('video.insert');
        }
      }
    }
    /**
     * Show the video edit popup.
     */


    function _showEditPopup() {
      var $popup = editor.popups.get('video.edit');
      if (!$popup) $popup = _initEditPopup();

      if ($popup) {
        editor.popups.setContainer('video.edit', editor.$sc);
        editor.popups.refresh('video.edit');
        var $video_obj = $current_video.find('iframe, embed, video');
        var left = $video_obj.offset().left + $video_obj.outerWidth() / 2;
        var top = $video_obj.offset().top + $video_obj.outerHeight();
        editor.popups.show('video.edit', left, top, $video_obj.outerHeight(), true);
      }
    }

    function _initInsertPopup(delayed) {
      if (delayed) {
        editor.popups.onRefresh('video.insert', _refreshInsertPopup);
        editor.popups.onHide('video.insert', _hideInsertPopup);
        return true;
      } // Video buttons.


      var video_buttons = '';

      if (!editor.opts.videoUpload && editor.opts.videoInsertButtons.indexOf('videoUpload') !== -1) {
        editor.opts.videoInsertButtons.splice(editor.opts.videoInsertButtons.indexOf('videoUpload'), 1);
      }

      var buttonList = editor.button.buildList(editor.opts.videoInsertButtons);

      if (buttonList !== '') {
        video_buttons = '<div class="fr-buttons">' + buttonList + '</div>';
      } // Video by url layer.


      var by_url_layer = '';
      var uploadIndex = editor.opts.videoInsertButtons.indexOf('videoUpload');
      var urlIndex = editor.opts.videoInsertButtons.indexOf('videoByURL');
      var embedIndex = editor.opts.videoInsertButtons.indexOf('videoEmbed');
      var active;

      if (urlIndex >= 0) {
        active = ' fr-active';

        if (urlIndex > uploadIndex && uploadIndex >= 0 || urlIndex > embedIndex && embedIndex >= 0) {
          active = '';
        }

        by_url_layer = '<div class="fr-video-by-url-layer fr-layer' + active + '" id="fr-video-by-url-layer-' + editor.id + '"><div class="fr-input-line"><input id="fr-video-by-url-layer-text-' + editor.id + '" type="text" placeholder="' + editor.language.translate('Paste in a video URL') + '" tabIndex="1" aria-required="true"></div><div class="fr-action-buttons"><button type="button" class="fr-command fr-submit" data-cmd="videoInsertByURL" tabIndex="2" role="button">' + editor.language.translate('Insert') + '</button></div></div>';
      } // Video embed layer.


      var embed_layer = '';

      if (embedIndex >= 0) {
        active = ' fr-active';

        if (embedIndex > uploadIndex && uploadIndex >= 0 || embedIndex > urlIndex && urlIndex >= 0) {
          active = '';
        }

        embed_layer = '<div class="fr-video-embed-layer fr-layer' + active + '" id="fr-video-embed-layer-' + editor.id + '"><div class="fr-input-line"><textarea id="fr-video-embed-layer-text' + editor.id + '" type="text" placeholder="' + editor.language.translate('Embedded Code') + '" tabIndex="1" aria-required="true" rows="5"></textarea></div><div class="fr-action-buttons"><button type="button" class="fr-command fr-submit" data-cmd="videoInsertEmbed" tabIndex="2" role="button">' + editor.language.translate('Insert') + '</button></div></div>';
      } // Video upload layer.


      var upload_layer = '';

      if (uploadIndex >= 0) {
        active = ' fr-active';

        if (uploadIndex > embedIndex && embedIndex >= 0 || uploadIndex > urlIndex && urlIndex >= 0) {
          active = '';
        }

        upload_layer = '<div class="fr-video-upload-layer fr-layer' + active + '" id="fr-video-upload-layer-' + editor.id + '"><strong>' + editor.language.translate('Drop video') + '</strong><br>(' + editor.language.translate('or click') + ')<div class="fr-form"><input type="file" accept="video/' + editor.opts.videoAllowedTypes.join(', video/').toLowerCase() + '" tabIndex="-1" aria-labelledby="fr-video-upload-layer-' + editor.id + '" role="button"></div></div>';
      } // Progress bar.


      var progress_bar_layer = '<div class="fr-video-progress-bar-layer fr-layer"><h3 tabIndex="-1" class="fr-message">Uploading</h3><div class="fr-loader"><span class="fr-progress"></span></div><div class="fr-action-buttons"><button type="button" class="fr-command fr-dismiss" data-cmd="videoDismissError" tabIndex="2" role="button">OK</button></div></div>';
      var template = {
        buttons: video_buttons,
        by_url_layer: by_url_layer,
        embed_layer: embed_layer,
        upload_layer: upload_layer,
        progress_bar: progress_bar_layer // Set the template in the popup.

      };
      var $popup = editor.popups.create('video.insert', template);

      _bindInsertEvents($popup);

      return $popup;
    }
    /**
     * Show the video upload layer.
     */


    function showLayer(name) {
      var $popup = editor.popups.get('video.insert');
      var left;
      var top;

      if (!$current_video && !editor.opts.toolbarInline) {
        var $btn = editor.$tb.find('.fr-command[data-cmd="insertVideo"]');
        left = $btn.offset().left;
        top = $btn.offset().top + (editor.opts.toolbarBottom ? 10 : $btn.outerHeight() - 10);
      }

      if (editor.opts.toolbarInline) {
        // Set top to the popup top.
        top = $popup.offset().top - editor.helpers.getPX($popup.css('margin-top')); // If the popup is above apply height correction.

        if ($popup.hasClass('fr-above')) {
          top += $popup.outerHeight();
        }
      } // Show the new layer.


      $popup.find('.fr-layer').removeClass('fr-active');
      $popup.find('.fr-' + name + '-layer').addClass('fr-active');
      editor.popups.show('video.insert', left, top, 0);
      editor.accessibility.focusPopup($popup);
    }
    /**
     * Refresh the insert by url button.
     */


    function refreshByURLButton($btn) {
      var $popup = editor.popups.get('video.insert');

      if ($popup && $popup.find('.fr-video-by-url-layer').hasClass('fr-active')) {
        $btn.addClass('fr-active').attr('aria-pressed', true);
      }
    }
    /**
     * Refresh the insert embed button.
     */


    function refreshEmbedButton($btn) {
      var $popup = editor.popups.get('video.insert');

      if ($popup && $popup.find('.fr-video-embed-layer').hasClass('fr-active')) {
        $btn.addClass('fr-active').attr('aria-pressed', true);
      }
    }
    /**
     * Refresh the insert upload button.
     */


    function refreshUploadButton($btn) {
      var $popup = editor.popups.get('video.insert');

      if ($popup && $popup.find('.fr-video-upload-layer').hasClass('fr-active')) {
        $btn.addClass('fr-active').attr('aria-pressed', true);
      }
    }
    /**
     * Insert video embedded object.
     */


    function insert(embedded_code) {
      // Make sure we have focus.
      editor.events.focus(true);
      editor.selection.restore(); // Flag to tell if the video is replaced.

      var replaced = false; // If current video found we have to replace it.

      if ($current_video) {
        // Remove the old video.
        remove(); // Mark that the video is replaced.

        replaced = true;
      }

      editor.html.insert('<span contenteditable="false" draggable="true" class="fr-jiv fr-video fr-deletable">' + embedded_code + '</span>', false, editor.opts.videoSplitHTML);
      editor.popups.hide('video.insert');
      var $video = editor.$el.find('.fr-jiv');
      $video.removeClass('fr-jiv');
      $video.toggleClass('fr-rv', editor.opts.videoResponsive);

      _setStyle($video, editor.opts.videoDefaultDisplay, editor.opts.videoDefaultAlign);

      $video.toggleClass('fr-draggable', editor.opts.videoMove);
      editor.events.trigger(replaced ? 'video.replaced' : 'video.inserted', [$video]);
    }

    function _loadedCallback() {
      var $video = $(this);
      editor.popups.hide('video.insert');
      $video.removeClass('fr-uploading'); // Select the video.

      if ($video.parent().next().is('br')) {
        $video.parent().next().remove();
      }

      _editVideo($video.parent());

      editor.events.trigger('video.loaded', [$video.parent()]);
    }
    /**
     * Insert html video into the editor.
     */


    function insertHtmlVideo(link, sanitize, data, $existing_video, response) {
      editor.edit.off();

      _setProgressMessage('Loading video');

      if (sanitize) link = editor.helpers.sanitizeURL(link);

      var _add = function _add() {
        var $video;
        var attr;

        if ($existing_video) {
          if (!editor.undo.canDo() && !$existing_video.find('video').hasClass('fr-uploading')) editor.undo.saveStep();
          var old_src = $existing_video.find('video').data('fr-old-src');
          var replaced = $existing_video.data('fr-replaced');
          $existing_video.data('fr-replaced', false);

          if (editor.$wp) {
            // Clone existing video.
            $video = $existing_video.clone(true);
            $video.find('video').removeData('fr-old-src').removeClass('fr-uploading'); // Remove load event.

            $video.find('video').off('canplay'); // Set new SRC.

            if (old_src) $existing_video.find('video').attr('src', old_src); // Replace existing video with its clone.

            $existing_video.replaceWith($video);
          } else {
            $video = $existing_video;
          } // Remove old data.


          var atts = $video.find('video').get(0).attributes;

          for (var i = 0; i < atts.length; i++) {
            var att = atts[i];

            if (att.nodeName.indexOf('data-') === 0) {
              $video.find('video').removeAttr(att.nodeName);
            }
          } // Set new data.


          if (typeof data != 'undefined') {
            for (attr in data) {
              if (data.hasOwnProperty(attr)) {
                if (attr != 'link') {
                  $video.find('video').attr('data-' + attr, data[attr]);
                }
              }
            }
          }

          $video.find('video').on('canplay', _loadedCallback);
          $video.find('video').attr('src', link);
          editor.edit.on();

          _syncVideos();

          editor.undo.saveStep(); // Cursor will not appear if we don't make blur.

          editor.$el.blur();
          editor.events.trigger(replaced ? 'video.replaced' : 'video.inserted', [$video, response]);
        } else {
          $video = _addVideo(link, data, _loadedCallback);

          _syncVideos();

          editor.undo.saveStep();
          editor.events.trigger('video.inserted', [$video, response]);
        }
      };

      showProgressBar('Loading video');

      _add();
    }
    /**
     * Show progress bar.
     */


    function showProgressBar(no_message) {
      var $popup = editor.popups.get('video.insert');
      if (!$popup) $popup = _initInsertPopup();
      $popup.find('.fr-layer.fr-active').removeClass('fr-active').addClass('fr-pactive');
      $popup.find('.fr-video-progress-bar-layer').addClass('fr-active');
      $popup.find('.fr-buttons').hide();

      if ($current_video) {
        var $current_video_obj = $current_video.find('video');
        editor.popups.setContainer('video.insert', editor.$sc);
        var left = $current_video_obj.offset().left;
        var top = $current_video_obj.offset().top + $current_video_obj.height();
        editor.popups.show('video.insert', left, top, $current_video_obj.outerHeight());
      }

      if (typeof no_message == 'undefined') {
        _setProgressMessage(editor.language.translate('Uploading'), 0);
      }
    }
    /**
     * Hide progress bar.
     */


    function hideProgressBar(dismiss) {
      var $popup = editor.popups.get('video.insert');

      if ($popup) {
        $popup.find('.fr-layer.fr-pactive').addClass('fr-active').removeClass('fr-pactive');
        $popup.find('.fr-video-progress-bar-layer').removeClass('fr-active');
        $popup.find('.fr-buttons').show(); // Dismiss error message.

        if (dismiss || editor.$el.find('video.fr-error').length) {
          editor.events.focus();

          if (editor.$el.find('video.fr-error').length) {
            editor.$el.find('video.fr-error').parent().remove();
            editor.undo.saveStep();
            editor.undo.run();
            editor.undo.dropRedo();
          }

          if (!editor.$wp && $current_video) {
            var $video = $current_video;

            _exitEdit(true);

            editor.selection.setAfter($video.find('video').get(0));
            editor.selection.restore();
          }

          editor.popups.hide('video.insert');
        }
      }
    }
    /**
     * Set a progress message.
     */


    function _setProgressMessage(message, progress) {
      var $popup = editor.popups.get('video.insert');

      if ($popup) {
        var $layer = $popup.find('.fr-video-progress-bar-layer');
        $layer.find('h3').text(message + (progress ? ' ' + progress + '%' : ''));
        $layer.removeClass('fr-error');

        if (progress) {
          $layer.find('div').removeClass('fr-indeterminate');
          $layer.find('div > span').css('width', progress + '%');
        } else {
          $layer.find('div').addClass('fr-indeterminate');
        }
      }
    }
    /**
     * Show error message to the user.
     */


    function _showErrorMessage(message) {
      showProgressBar();
      var $popup = editor.popups.get('video.insert');
      var $layer = $popup.find('.fr-video-progress-bar-layer');
      $layer.addClass('fr-error');
      var $message_header = $layer.find('h3');
      $message_header.text(message);
      editor.events.disableBlur();
      $message_header.focus();
    }
    /**
     * Insert video by URL.
     */


    function insertByURL(link) {
      if (typeof link == 'undefined') {
        var $popup = editor.popups.get('video.insert');
        link = ($popup.find('.fr-video-by-url-layer input[type="text"]').val() || '').trim();
      }

      var video = null;

      if (!/^http/.test(link)) {
        link = 'https://' + link;
      }

      if (editor.helpers.isURL(link)) {
        for (var i = 0; i < FE.VIDEO_PROVIDERS.length; i++) {
          var vp = FE.VIDEO_PROVIDERS[i]; // Check if video provider is allowed.

          if (vp.test_regex.test(link) && new RegExp(editor.opts.videoAllowedProviders.join('|')).test(vp.provider)) {
            video = link.replace(vp.url_regex, vp.url_text);
            video = vp.html.replace(/\{url\}/, video);
            break;
          }
        }
      }

      if (video) {
        insert(video);
      } else {
        _showErrorMessage(editor.language.translate('Something went wrong. Please try again.'));

        editor.events.trigger('video.linkError', [link]);
      }
    }
    /**
     * Insert embedded video.
     */


    function insertEmbed(code) {
      if (typeof code == 'undefined') {
        var $popup = editor.popups.get('video.insert');
        code = $popup.find('.fr-video-embed-layer textarea').val() || '';
      }

      if (code.length === 0 || !FE.VIDEO_EMBED_REGEX.test(code)) {
        _showErrorMessage(editor.language.translate('Something went wrong. Please try again.'));

        editor.events.trigger('video.codeError', [code]);
      } else {
        insert(code);
      }
    }

    function _editVideo($video) {
      _edit.call($video.get(0));
    }
    /**
     * Parse video response.
     */


    function _parseResponse(response) {
      try {
        if (editor.events.trigger('video.uploaded', [response], true) === false) {
          editor.edit.on();
          return false;
        }

        var resp = JSON.parse(response);

        if (resp.link) {
          return resp;
        } else {
          // No link in upload request.
          _throwError(MISSING_LINK, response);

          return false;
        }
      } catch (ex) {
        // Bad response.
        _throwError(BAD_RESPONSE, response);

        return false;
      }
    }
    /**
     * Parse video response.
     */


    function _parseXMLResponse(response) {
      try {
        var link = $(response).find('Location').text();
        var key = $(response).find('Key').text();

        if (editor.events.trigger('video.uploadedToS3', [link, key, response], true) === false) {
          editor.edit.on();
          return false;
        }

        return link;
      } catch (ex) {
        // Bad response.
        _throwError(BAD_RESPONSE, response);

        return false;
      }
    }
    /**
     * Video was uploaded to the server and we have a response.
     */


    function _videoUploaded($video) {
      _setProgressMessage('Loading video');

      var status = this.status;
      var response = this.response;
      var responseXML = this.responseXML;
      var responseText = this.responseText;

      try {
        if (editor.opts.videoUploadToS3) {
          if (status == 201) {
            var link = _parseXMLResponse(responseXML);

            if (link) {
              insertHtmlVideo(link, false, [], $video, response || responseXML);
            }
          } else {
            _throwError(BAD_RESPONSE, response || responseXML);
          }
        } else {
          if (status >= 200 && status < 300) {
            var resp = _parseResponse(responseText);

            if (resp) {
              insertHtmlVideo(resp.link, false, resp, $video, response || responseText);
            }
          } else {
            _throwError(ERROR_DURING_UPLOAD, response || responseText);
          }
        }
      } catch (ex) {
        // Bad response.
        _throwError(BAD_RESPONSE, response || responseText);
      }
    }
    /**
     * Video upload error.
     */


    function _videoUploadError() {
      _throwError(BAD_RESPONSE, this.response || this.responseText || this.responseXML);
    }
    /**
     * Video upload progress.
     */


    function _videoUploadProgress(e) {
      if (e.lengthComputable) {
        var complete = e.loaded / e.total * 100 | 0;

        _setProgressMessage(editor.language.translate('Uploading'), complete);
      }
    }
    /**
     * Video upload aborted.
     */


    function _videoUploadAborted() {
      editor.edit.on();
      hideProgressBar(true);
    }

    function _addVideo(link, data, loadCallback) {
      // Build video data string.
      var data_str = '';
      var attr;

      if (data && typeof data != 'undefined') {
        for (attr in data) {
          if (data.hasOwnProperty(attr)) {
            if (attr != 'link') {
              data_str += ' data-' + attr + '="' + data[attr] + '"';
            }
          }
        }
      }

      var width = editor.opts.videoDefaultWidth;

      if (width && width != 'auto') {
        width = width + 'px';
      } // Create video object and set the load event.


      var $video = $(document.createElement('span')).attr('contenteditable', 'false').attr('draggable', 'true').attr('class', 'fr-video fr-dv' + editor.opts.videoDefaultDisplay[0] + (editor.opts.videoDefaultAlign != 'center' ? ' fr-fv' + editor.opts.videoDefaultAlign[0] : '')).html('<video src="' + link + '" ' + data_str + (width ? ' style="width: ' + width + ';" ' : '') + ' controls>' + editor.language.translate('Your browser does not support HTML5 video.') + '</video>');
      $video.toggleClass('fr-draggable', editor.opts.videoMove); // Make sure we have focus.
      // Call the event.

      editor.edit.on();
      editor.events.focus(true);
      editor.selection.restore();
      editor.undo.saveStep(); // Insert marker and then replace it with the video.

      if (editor.opts.videoSplitHTML) {
        editor.markers.split();
      } else {
        editor.markers.insert();
      }

      editor.html.wrap();
      var $marker = editor.$el.find('.fr-marker'); // Do not insert video inside emoticon.

      if (editor.node.isLastSibling($marker) && $marker.parent().hasClass('fr-deletable')) {
        $marker.insertAfter($marker.parent());
      }

      $marker.replaceWith($video);
      editor.selection.clear();

      if ($video.find('video').get(0).readyState > $video.find('video').get(0).HAVE_FUTURE_DATA || editor.helpers.isIOS()) {
        loadCallback.call($video.find('video').get(0));
      } else {
        $video.find('video').on('canplaythrough load', loadCallback);
      }

      return $video;
    }
    /**
     * Mouse down to start resize.
     */


    function _handlerMousedown(e) {
      // Check if resizer belongs to current instance.
      if (!editor.core.sameInstance($video_resizer)) return true;
      e.preventDefault();
      e.stopPropagation();
      var c_x = e.pageX || (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : null);
      var c_y = e.pageY || (e.originalEvent.touches ? e.originalEvent.touches[0].pageY : null);

      if (!c_x || !c_y) {
        return false;
      } // Only on mousedown. This function could be called from keydown on accessibility.


      if (e.type == 'mousedown') {
        // See if the entire editor is inside iframe to adjust starting offsets.
        var oel = editor.$oel.get(0);
        var doc = oel.ownerDocument;
        var win = doc.defaultView || doc.parentWindow;
        var editor_inside_iframe = false;

        try {
          editor_inside_iframe = win.location != win.parent.location && !(win.$ && win.$.FE);
        } catch (ex) {}

        if (editor_inside_iframe && win.frameElement) {
          c_x += editor.helpers.getPX($(win.frameElement).offset().left) + win.frameElement.clientLeft; // Override c_y with clientY attribute.

          c_y = e.clientY + editor.helpers.getPX($(win.frameElement).offset().top) + win.frameElement.clientTop;
        }
      }

      if (!editor.undo.canDo()) editor.undo.saveStep();
      $handler = $(this);
      $handler.data('start-x', c_x);
      $handler.data('start-y', c_y);
      $overlay.show();
      editor.popups.hideAll();

      _unmarkExit();
    }
    /**
     * Do resize.
     */


    function _handlerMousemove(e) {
      // Check if resizer belongs to current instance.
      if (!editor.core.sameInstance($video_resizer)) return true;

      if ($handler) {
        e.preventDefault();
        var c_x = e.pageX || (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : null);
        var c_y = e.pageY || (e.originalEvent.touches ? e.originalEvent.touches[0].pageY : null);

        if (!c_x || !c_y) {
          return false;
        }

        var s_x = $handler.data('start-x');
        var s_y = $handler.data('start-y');
        $handler.data('start-x', c_x);
        $handler.data('start-y', c_y);
        var diff_x = c_x - s_x;
        var diff_y = c_y - s_y;
        var $video_obj = $current_video.find('iframe, embed, video');
        var width = $video_obj.width();
        var height = $video_obj.height();

        if ($handler.hasClass('fr-hnw') || $handler.hasClass('fr-hsw')) {
          diff_x = 0 - diff_x;
        }

        if ($handler.hasClass('fr-hnw') || $handler.hasClass('fr-hne')) {
          diff_y = 0 - diff_y;
        }

        $video_obj.css('width', width + diff_x);
        $video_obj.css('height', height + diff_y);
        $video_obj.removeAttr('width');
        $video_obj.removeAttr('height');

        _repositionResizer();
      }
    }
    /**
     * Stop resize.
     */


    function _handlerMouseup(e) {
      // Check if resizer belongs to current instance.
      if (!editor.core.sameInstance($video_resizer)) return true;

      if ($handler && $current_video) {
        if (e) e.stopPropagation();
        $handler = null;
        $overlay.hide();

        _repositionResizer();

        _showEditPopup();

        editor.undo.saveStep();
      }
    }
    /**
     * Create resize handler.
     */


    function _getHandler(pos) {
      return '<div class="fr-handler fr-h' + pos + '"></div>';
    }

    function _resizeVideo(e, initPageX, direction, step) {
      e.pageX = initPageX;
      e.pageY = initPageX;

      _handlerMousedown.call(this, e);

      e.pageX = e.pageX + direction * Math.floor(Math.pow(1.1, step));
      e.pageY = e.pageY + direction * Math.floor(Math.pow(1.1, step));

      _handlerMousemove.call(this, e);

      _handlerMouseup.call(this, e);

      return ++step;
    }
    /**
     * Init video resizer.
     */


    function _initResizer() {
      var doc; // No shared video resizer.

      if (!editor.shared.$video_resizer) {
        // Create shared video resizer.
        editor.shared.$video_resizer = $(document.createElement('div')).attr('class', 'fr-video-resizer');
        $video_resizer = editor.shared.$video_resizer; // Bind mousedown event shared.

        editor.events.$on($video_resizer, 'mousedown', function (e) {
          e.stopPropagation();
        }, true); // video resize is enabled.

        if (editor.opts.videoResize) {
          $video_resizer.append(_getHandler('nw') + _getHandler('ne') + _getHandler('sw') + _getHandler('se')); // Add video resizer overlay and set it.

          editor.shared.$vid_overlay = $(document.createElement('div')).attr('class', 'fr-video-overlay');
          $overlay = editor.shared.$vid_overlay;
          doc = $video_resizer.get(0).ownerDocument;
          $(doc).find('body').first().append($overlay);
        }
      } else {
        $video_resizer = editor.shared.$video_resizer;
        $overlay = editor.shared.$vid_overlay;
        editor.events.on('destroy', function () {
          $('body').first().append($video_resizer.removeClass('fr-active'));
        }, true);
      } // Shared destroy.


      editor.events.on('shared.destroy', function () {
        $video_resizer.html('').removeData().remove();
        $video_resizer = null;

        if (editor.opts.videoResize) {
          $overlay.remove();
          $overlay = null;
        }
      }, true); // Window resize. Exit from edit.

      if (!editor.helpers.isMobile()) {
        editor.events.$on($(editor.o_win), 'resize.video', function () {
          _exitEdit(true);
        });
      } // video resize is enabled.


      if (editor.opts.videoResize) {
        doc = $video_resizer.get(0).ownerDocument;
        editor.events.$on($video_resizer, editor._mousedown, '.fr-handler', _handlerMousedown);
        editor.events.$on($(doc), editor._mousemove, _handlerMousemove);
        editor.events.$on($(doc.defaultView || doc.parentWindow), editor._mouseup, _handlerMouseup);
        editor.events.$on($overlay, 'mouseleave', _handlerMouseup); // Accessibility.
        // Used for keys holing.

        var step = 1;
        var prevKey = null;
        var prevTimestamp = 0; // Keydown event.

        editor.events.on('keydown', function (e) {
          if ($current_video) {
            var ctrlKey = navigator.userAgent.indexOf('Mac OS X') != -1 ? e.metaKey : e.ctrlKey;
            var keycode = e.which;

            if (keycode !== prevKey || e.timeStamp - prevTimestamp > 200) {
              step = 1; // Reset step. Known browser issue: Keyup does not trigger when ctrl is pressed.
            } // Increase video size.


            if ((keycode == FE.KEYCODE.EQUALS || editor.browser.mozilla && keycode == FE.KEYCODE.FF_EQUALS) && ctrlKey && !e.altKey) {
              step = _resizeVideo.call(this, e, 1, 1, step);
            } // Decrease video size.
            else if ((keycode == FE.KEYCODE.HYPHEN || editor.browser.mozilla && keycode == FE.KEYCODE.FF_HYPHEN) && ctrlKey && !e.altKey) {
                step = _resizeVideo.call(this, e, 2, -1, step);
              } // Save key code.


            prevKey = keycode; // Save timestamp.

            prevTimestamp = e.timeStamp;
          }
        }); // Reset the step on key up event.

        editor.events.on('keyup', function () {
          step = 1;
        });
      }
    }
    /**
     * Keep videos in sync when content changed.
     */


    var videos;

    function _syncVideos() {
      // Get current videos.
      var c_videos = Array.prototype.slice.call(editor.el.querySelectorAll('video, .fr-video > *')); // Current videos src.

      var video_srcs = [];
      var i;

      for (i = 0; i < c_videos.length; i++) {
        video_srcs.push(c_videos[i].getAttribute('src'));
        $(c_videos[i]).toggleClass('fr-draggable', editor.opts.videoMove);
        if (c_videos[i].getAttribute('class') === '') c_videos[i].removeAttribute('class');
        if (c_videos[i].getAttribute('style') === '') c_videos[i].removeAttribute('style');
      } // Loop previous videos and check their src.


      if (videos) {
        for (i = 0; i < videos.length; i++) {
          if (video_srcs.indexOf(videos[i].getAttribute('src')) < 0) {
            editor.events.trigger('video.removed', [$(videos[i])]);
          }
        }
      } // Current videos are the old ones.


      videos = c_videos;
    }
    /**
     * Reposition resizer.
     */


    function _repositionResizer() {
      if (!$video_resizer) _initResizer();
      (editor.$wp || editor.$sc).append($video_resizer);
      $video_resizer.data('instance', editor);
      var $video_obj = $current_video.find('iframe, embed, video');
      var iframePaddingLeft = 0;
      var iframePaddingTop = 0;

      if (editor.opts.iframe) {
        iframePaddingTop = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-top'));
        iframePaddingLeft = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-left'));
      }

      $video_resizer.css('top', (editor.opts.iframe ? $video_obj.offset().top + iframePaddingTop - 1 : $video_obj.offset().top - editor.$wp.offset().top - 1) + editor.$wp.scrollTop()).css('left', (editor.opts.iframe ? $video_obj.offset().left + iframePaddingLeft - 1 : $video_obj.offset().left - editor.$wp.offset().left - 1) + editor.$wp.scrollLeft()).css('width', $video_obj.get(0).getBoundingClientRect().width).css('height', $video_obj.get(0).getBoundingClientRect().height).addClass('fr-active');
    }
    /**
     * Edit video.
     */


    var touchScroll;

    function _edit(e) {
      if (e && e.type == 'touchend' && touchScroll) {
        return true;
      }

      if (e && editor.edit.isDisabled()) {
        e.stopPropagation();
        e.preventDefault();
        return false;
      }

      if (editor.edit.isDisabled()) {
        return false;
      } // Hide resizer for other instances.


      for (var i = 0; i < FE.INSTANCES.length; i++) {
        if (FE.INSTANCES[i] != editor) {
          FE.INSTANCES[i].events.trigger('video.hideResizer');
        }
      }

      editor.toolbar.disable(); // Hide keyboard.

      if (editor.helpers.isMobile()) {
        editor.events.disableBlur();
        editor.$el.blur();
        editor.events.enableBlur();
      } // Unselect all other videos.


      editor.$el.find('.fr-video.fr-active').removeClass('fr-active');
      $current_video = $(this);
      $current_video.addClass('fr-active');

      if (editor.opts.iframe) {
        editor.size.syncIframe();
      }

      _selectVideo();

      _repositionResizer();

      _showEditPopup();

      editor.selection.clear();
      editor.button.bulkRefresh();
      editor.events.trigger('image.hideResizer');
    }
    /**
     * Exit edit.
     */


    function _exitEdit(force_exit) {
      if ($current_video && (_canExit() || force_exit === true)) {
        $video_resizer.removeClass('fr-active');
        editor.toolbar.enable();
        $current_video.removeClass('fr-active');
        $current_video = null;

        _unmarkExit();
      }
    }

    editor.shared.vid_exit_flag = false;

    function _markExit() {
      editor.shared.vid_exit_flag = true;
    }

    function _unmarkExit() {
      editor.shared.vid_exit_flag = false;
    }

    function _canExit() {
      return editor.shared.vid_exit_flag;
    }

    function _drop(e) {
      // Check if we are dropping files.
      var dt = e.originalEvent.dataTransfer;

      if (dt && dt.files && dt.files.length) {
        var vid = dt.files[0];

        if (vid && vid.type && vid.type.indexOf('video') !== -1) {
          if (!editor.opts.videoUpload) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }

          editor.markers.remove();
          editor.markers.insertAtPoint(e.originalEvent);
          editor.$el.find('.fr-marker').replaceWith(FE.MARKERS); // Hide popups.

          editor.popups.hideAll(); // Show the video insert popup.

          var $popup = editor.popups.get('video.insert');
          if (!$popup) $popup = _initInsertPopup();
          editor.popups.setContainer('video.insert', editor.$sc);
          editor.popups.show('video.insert', e.originalEvent.pageX, e.originalEvent.pageY);
          showProgressBar(); // Dropped file is an video that we allow.

          if (editor.opts.videoAllowedTypes.indexOf(vid.type.replace(/video\//g, '')) >= 0) {
            // Upload videos.
            upload(dt.files);
          } else {
            _throwError(BAD_FILE_TYPE);
          } // Cancel anything else.


          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    }

    function _browserUpload(video) {
      // if current video is embedded video,remove it.
      if ($current_video && $current_video.find('iframe') && $current_video.find('iframe').length) {
        remove();
      }

      var reader = new FileReader();

      reader.onload = function () {
        var link = reader.result; // Convert image to local blob.

        var binary = atob(reader.result.split(',')[1]);
        var array = [];

        for (var i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        } // Get local image link.


        link = window.URL.createObjectURL(new Blob([new Uint8Array(array)], {
          type: video.type
        }));
        insertHtmlVideo(link, false, null, $current_video);
      };

      showProgressBar();
      reader.readAsDataURL(video);
    }
    /**
     * Do video upload.
     */


    function upload(videos) {
      // Make sure we have what to upload.
      if (typeof videos != 'undefined' && videos.length > 0) {
        // Check if we should cancel the video upload.
        if (editor.events.trigger('video.beforeUpload', [videos]) === false) {
          return false;
        }

        var video = videos[0]; // Upload as blob for testing purposes.

        if ((editor.opts.videoUploadURL === null || editor.opts.videoUploadURL == DEFAULT_VIDEO_UPLOAD_URL) && !editor.opts.videoUploadToS3) {
          _browserUpload(video);

          return false;
        } // Check video max size.


        if (video.size > editor.opts.videoMaxSize) {
          _throwError(MAX_SIZE_EXCEEDED);

          return false;
        } // Check video types.


        if (editor.opts.videoAllowedTypes.indexOf(video.type.replace(/video\//g, '')) < 0) {
          _throwError(BAD_FILE_TYPE);

          return false;
        } // Create form Data.


        var form_data;

        if (editor.drag_support.formdata) {
          form_data = editor.drag_support.formdata ? new FormData() : null;
        } // Prepare form data for request.


        if (form_data) {
          var key; // Upload to S3.

          if (editor.opts.videoUploadToS3 !== false) {
            form_data.append('key', editor.opts.videoUploadToS3.keyStart + new Date().getTime() + '-' + (video.name || 'untitled'));
            form_data.append('success_action_status', '201');
            form_data.append('X-Requested-With', 'xhr');
            form_data.append('Content-Type', video.type);

            for (key in editor.opts.videoUploadToS3.params) {
              if (editor.opts.videoUploadToS3.params.hasOwnProperty(key)) {
                form_data.append(key, editor.opts.videoUploadToS3.params[key]);
              }
            }
          } // Add upload params.


          for (key in editor.opts.videoUploadParams) {
            if (editor.opts.videoUploadParams.hasOwnProperty(key)) {
              form_data.append(key, editor.opts.videoUploadParams[key]);
            }
          } // Set the video in the request.


          form_data.append(editor.opts.videoUploadParam, video); // Create XHR request.

          var url = editor.opts.videoUploadURL;

          if (editor.opts.videoUploadToS3) {
            if (editor.opts.videoUploadToS3.uploadURL) {
              url = editor.opts.videoUploadToS3.uploadURL;
            } else {
              url = 'https://' + editor.opts.videoUploadToS3.region + '.amazonaws.com/' + editor.opts.videoUploadToS3.bucket;
            }
          }

          var xhr = editor.core.getXHR(url, editor.opts.videoUploadMethod); // Set upload events.

          xhr.onload = function () {
            _videoUploaded.call(xhr, $current_video);
          };

          xhr.onerror = _videoUploadError;
          xhr.upload.onprogress = _videoUploadProgress;
          xhr.onabort = _videoUploadAborted;
          showProgressBar();
          editor.events.disableBlur();
          editor.edit.off();
          editor.events.enableBlur();
          var $popup = editor.popups.get('video.insert');

          if ($popup) {
            $($popup.off('abortUpload')).on('abortUpload', function () {
              if (xhr.readyState != 4) {
                xhr.abort();
              }
            });
          } // Send data.


          xhr.send(form_data);
        }
      }
    }
    /**
     * Video drop inside the upload zone.
     */


    function _bindInsertEvents($popup) {
      // Drag over the dropable area.
      editor.events.$on($popup, 'dragover dragenter', '.fr-video-upload-layer', function () {
        $(this).addClass('fr-drop');
        return false;
      }, true); // Drag end.

      editor.events.$on($popup, 'dragleave dragend', '.fr-video-upload-layer', function () {
        $(this).removeClass('fr-drop');
        return false;
      }, true); // Drop.

      editor.events.$on($popup, 'drop', '.fr-video-upload-layer', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('fr-drop');
        var dt = e.originalEvent.dataTransfer;

        if (dt && dt.files) {
          var inst = $popup.data('instance') || editor;
          inst.events.disableBlur();
          inst.video.upload(dt.files);
          inst.events.enableBlur();
        }
      }, true);

      if (editor.helpers.isIOS()) {
        editor.events.$on($popup, 'touchstart', '.fr-video-upload-layer input[type="file"]', function () {
          $(this).trigger('click');
        }, true);
      }

      editor.events.$on($popup, 'change', '.fr-video-upload-layer input[type="file"]', function () {
        if (this.files) {
          var inst = $popup.data('instance') || editor;
          inst.events.disableBlur();
          $popup.find('input:focus').blur();
          inst.events.enableBlur();
          inst.video.upload(this.files);
        } // Else IE 9 case.
        // Chrome fix.


        $(this).val('');
      }, true);
    }
    /**
     * Init the video events.
     */


    function _initEvents() {
      // Drop inside the editor.
      editor.events.on('drop', _drop, true);
      editor.events.on('mousedown window.mousedown', _markExit);
      editor.events.on('window.touchmove', _unmarkExit);
      editor.events.on('mouseup window.mouseup', _exitEdit);
      editor.events.on('commands.mousedown', function ($btn) {
        if ($btn.parents('.fr-toolbar').length > 0) {
          _exitEdit();
        }
      });
      editor.events.on('video.hideResizer commands.undo commands.redo element.dropped', function () {
        _exitEdit(true);
      });
    }
    /**
     * Throw a video error.
     */


    function _throwError(code, response) {
      editor.edit.on();
      if ($current_video) $current_video.find('video').addClass('fr-error');

      _showErrorMessage(editor.language.translate('Something went wrong. Please try again.'));

      editor.events.trigger('video.error', [{
        code: code,
        message: error_messages[code]
      }, response]);
    }
    /**
     * Init the video edit popup.
     */


    function _initEditPopup() {
      // Video buttons.
      var video_buttons = '';

      if (editor.opts.videoEditButtons.length > 0) {
        if (editor.opts.videoResponsive) {
          if (editor.opts.videoEditButtons.indexOf('videoSize') > -1) {
            editor.opts.videoEditButtons.splice(editor.opts.videoEditButtons.indexOf('videoSize'), 1);
          }

          if (editor.opts.videoEditButtons.indexOf('videoDisplay') > -1) {
            editor.opts.videoEditButtons.splice(editor.opts.videoEditButtons.indexOf('videoDisplay'), 1);
          }

          if (editor.opts.videoEditButtons.indexOf('videoAlign') > -1) {
            editor.opts.videoEditButtons.splice(editor.opts.videoEditButtons.indexOf('videoAlign'), 1);
          }
        }

        video_buttons += "<div class=\"fr-buttons\"> \n      ".concat(editor.button.buildList(editor.opts.videoEditButtons), " \n      </div>");
        var template = {
          buttons: video_buttons
        };
        var $popup = editor.popups.create('video.edit', template);
        editor.events.$on(editor.$wp, 'scroll.video-edit', function () {
          if ($current_video && editor.popups.isVisible('video.edit')) {
            editor.events.disableBlur();

            _editVideo($current_video);
          }
        });
        return $popup;
      }

      return false;
    }
    /**
     * Refresh the size popup.
     */


    function _refreshSizePopup() {
      if ($current_video) {
        var $popup = editor.popups.get('video.size');
        var $video_obj = $current_video.find('iframe, embed, video');
        $popup.find('input[name="width"]').val($video_obj.get(0).style.width || $video_obj.attr('width')).trigger('change');
        $popup.find('input[name="height"]').val($video_obj.get(0).style.height || $video_obj.attr('height')).trigger('change');
      }
    }
    /**
     * Show the size popup.
     */


    function showSizePopup() {
      var $popup = editor.popups.get('video.size');
      if (!$popup) $popup = _initSizePopup();
      hideProgressBar();
      editor.popups.refresh('video.size');
      editor.popups.setContainer('video.size', editor.$sc);
      var $video_obj = $current_video.find('iframe, embed, video');
      var left = $video_obj.offset().left + $video_obj.outerWidth() / 2;
      var top = $video_obj.offset().top + $video_obj.height();
      editor.popups.show('video.size', left, top, $video_obj.height(), true);
    }
    /**
     * Init the video upload popup.
     */


    function _initSizePopup(delayed) {
      if (delayed) {
        editor.popups.onRefresh('video.size', _refreshSizePopup);
        return true;
      } // Video buttons.


      var video_buttons = '';
      video_buttons = '<div class="fr-buttons fr-tabs">' + editor.button.buildList(editor.opts.videoSizeButtons) + '</div>'; // Size layer.

      var size_layer = '';
      size_layer = '<div class="fr-video-size-layer fr-layer fr-active" id="fr-video-size-layer-' + editor.id + '"><div class="fr-video-group"><div class="fr-input-line"><input id="fr-video-size-layer-width-' + editor.id + '" type="text" name="width" placeholder="' + editor.language.translate('Width') + '" tabIndex="1"></div><div class="fr-input-line"><input id="fr-video-size-layer-height-' + editor.id + '" type="text" name="height" placeholder="' + editor.language.translate('Height') + '" tabIndex="1"></div></div><div class="fr-action-buttons"><button type="button" class="fr-command fr-submit" data-cmd="videoSetSize" tabIndex="2" role="button">' + editor.language.translate('Update') + '</button></div></div>';
      var template = {
        buttons: video_buttons,
        size_layer: size_layer // Set the template in the popup.

      };
      var $popup = editor.popups.create('video.size', template);
      editor.events.$on(editor.$wp, 'scroll', function () {
        if ($current_video && editor.popups.isVisible('video.size')) {
          editor.events.disableBlur();

          _editVideo($current_video);
        }
      });
      return $popup;
    }
    /**
     * Get video alignment.
     */


    function getAlign($video) {
      if (typeof $video == 'undefined') $video = $current_video;

      if ($video) {
        // Video has left class.
        if ($video.hasClass('fr-fvl')) {
          return 'left';
        } // Video has right class.
        else if ($video.hasClass('fr-fvr')) {
            return 'right';
          } // Video has display class set.
          else if ($video.hasClass('fr-dvb') || $video.hasClass('fr-dvi')) {
              return 'center';
            } else {
              // Video has display block.
              if ($video.css('display') == 'block') {
                // Margin left is 0.
                // Margin right is auto.
                if ($video.css('text-algin') == 'left') {
                  return 'left';
                } // Margin left is auto.
                // Margin right is 0.
                else if ($video.css('text-align') == 'right') {
                    return 'right';
                  }
              } // Display inline.
              else {
                  // Float left.
                  if ($video.css('float') == 'left') {
                    return 'left';
                  } // Float right.
                  else if ($video.css('float') == 'right') {
                      return 'right';
                    }
                }
            }
      }

      return 'center';
    }
    /**
     * Align video.
     */


    function align(val) {
      $current_video.removeClass('fr-fvr fr-fvl'); // Easy case. Use classes.

      if (!editor.opts.htmlUntouched && editor.opts.useClasses) {
        if (val == 'left') {
          $current_video.addClass('fr-fvl');
        } else if (val == 'right') {
          $current_video.addClass('fr-fvr');
        }
      } else {
        _setStyle($current_video, getDisplay(), val);
      }

      _selectVideo();

      _repositionResizer();

      _showEditPopup();

      editor.selection.clear();
    }
    /**
     * Refresh the align icon.
     */


    function refreshAlign($btn) {
      if (!$current_video) return false;
      $btn.find('>*').first().replaceWith(editor.icon.create('video-align-' + getAlign()));
    }
    /**
     * Refresh the align option from the dropdown.
     */


    function refreshAlignOnShow($btn, $dropdown) {
      if ($current_video) {
        $dropdown.find('.fr-command[data-param1="' + getAlign() + '"]').addClass('fr-active').attr('aria-selected', true);
      }
    }
    /**
     * Get video display.
     */


    function getDisplay($video) {
      if (typeof $video == 'undefined') $video = $current_video; // Set float to none.

      var flt = $video.css('float');
      $video.css('float', 'none'); // Video has display block.

      if ($video.css('display') == 'block') {
        // Set float to the initial value.
        $video.css('float', '');
        if ($video.css('float') != flt) $video.css('float', flt);
        return 'block';
      } // Display inline.
      else {
          // Set float.
          $video.css('float', '');
          if ($video.css('float') != flt) $video.css('float', flt);
          return 'inline';
        }
    }
    /**
     * Set video display.
     */


    function display(val) {
      $current_video.removeClass('fr-dvi fr-dvb'); // Easy case. Use classes.

      if (!editor.opts.htmlUntouched && editor.opts.useClasses) {
        if (val == 'inline') {
          $current_video.addClass('fr-dvi');
        } else if (val == 'block') {
          $current_video.addClass('fr-dvb');
        }
      } else {
        _setStyle($current_video, val, getAlign());
      }

      _selectVideo();

      _repositionResizer();

      _showEditPopup();

      editor.selection.clear();
    }
    /**
     * Refresh the video display selected option.
     */


    function refreshDisplayOnShow($btn, $dropdown) {
      if ($current_video) {
        $dropdown.find('.fr-command[data-param1="' + getDisplay() + '"]').addClass('fr-active').attr('aria-selected', true);
      }
    }
    /**
     * Show the replace popup.
     */


    function replace() {
      var $popup = editor.popups.get('video.insert');
      if (!$popup) $popup = _initInsertPopup();

      if (!editor.popups.isVisible('video.insert')) {
        hideProgressBar();
        editor.popups.refresh('video.insert');
        editor.popups.setContainer('video.insert', editor.$sc);
      }

      var left = $current_video.offset().left + $current_video.outerWidth() / 2;
      var top = $current_video.offset().top + $current_video.height();
      editor.popups.show('video.insert', left, top, $current_video.outerHeight(), true);
    }
    /**
     * Remove current selected video.
     */


    function remove() {
      if ($current_video) {
        if (editor.events.trigger('video.beforeRemove', [$current_video]) !== false) {
          var $video = $current_video;
          editor.popups.hideAll();

          _exitEdit(true);

          editor.selection.setBefore($video.get(0)) || editor.selection.setAfter($video.get(0));
          $video.remove();
          editor.selection.restore();
          editor.html.fillEmptyBlocks();
        }
      }
    }
    /**
     * Hide image upload popup.
     */


    function _hideInsertPopup() {
      hideProgressBar();
    }

    function _setStyle($video, _display, _align) {
      if (!editor.opts.htmlUntouched && editor.opts.useClasses) {
        $video.removeClass('fr-fvl fr-fvr fr-dvb fr-dvi');
        $video.addClass('fr-fv' + _align[0] + ' fr-dv' + _display[0]);
      } else {
        if (_display == 'inline') {
          $video.css({
            display: 'inline-block'
          });

          if (_align == 'center') {
            $video.css({
              'float': 'none'
            });
          } else if (_align == 'left') {
            $video.css({
              'float': 'left'
            });
          } else {
            $video.css({
              'float': 'right'
            });
          }
        } else {
          $video.css({
            display: 'block',
            clear: 'both'
          });

          if (_align == 'left') {
            $video.css({
              textAlign: 'left'
            });
          } else if (_align == 'right') {
            $video.css({
              textAlign: 'right'
            });
          } else {
            $video.css({
              textAlign: 'center'
            });
          }
        }
      }
    }
    /**
     * Convert style to classes.
     */


    function _convertStyleToClasses($video) {
      if (!$video.hasClass('fr-dvi') && !$video.hasClass('fr-dvb')) {
        $video.addClass('fr-fv' + getAlign($video)[0]);
        $video.addClass('fr-dv' + getDisplay($video)[0]);
      }
    }
    /**
     * Convert classes to style.
     */


    function _convertClassesToStyle($video) {
      var d = $video.hasClass('fr-dvb') ? 'block' : $video.hasClass('fr-dvi') ? 'inline' : null;
      var a = $video.hasClass('fr-fvl') ? 'left' : $video.hasClass('fr-fvr') ? 'right' : getAlign($video);

      _setStyle($video, d, a);

      $video.removeClass('fr-dvb fr-dvi fr-fvr fr-fvl');
    }
    /**
     * Refresh video list.
     */


    function _refreshVideoList() {
      // Find possible candidates that are not wrapped.
      var candidates = editor.$el.find('video').filter(function () {
        return $(this).parents('span.fr-video').length === 0;
      });

      if (candidates.length == 0) {
        return;
      }

      candidates.wrap($(document.createElement('span')).attr('class', 'fr-video fr-deletable').attr('contenteditable', 'false'));
      editor.$el.find('embed, iframe').filter(function () {
        if (editor.browser.safari && this.getAttribute('src')) {
          this.setAttribute('src', this.src);
        }

        if ($(this).parents('span.fr-video').length > 0) return false;
        var link = $(this).attr('src');

        for (var i = 0; i < FE.VIDEO_PROVIDERS.length; i++) {
          var vp = FE.VIDEO_PROVIDERS[i]; // Check if video provider is allowed.

          if (vp.test_regex.test(link) && new RegExp(editor.opts.videoAllowedProviders.join('|')).test(vp.provider)) {
            return true;
          }
        }

        return false;
      }).map(function () {
        return $(this).parents('object').length === 0 ? this : $(this).parents('object').get(0);
      }).wrap($(document.createElement('span')).attr('class', 'fr-video').attr('contenteditable', 'false'));
      var videos = editor.$el.find('span.fr-video, video');

      for (var i = 0; i < videos.length; i++) {
        var $video = $(videos[i]);

        if (!editor.opts.htmlUntouched && editor.opts.useClasses) {
          _convertStyleToClasses($video);

          if (!editor.opts.videoTextNear) {
            $video.removeClass('fr-dvi').addClass('fr-dvb');
          }
        } else if (!editor.opts.htmlUntouched && !editor.opts.useClasses) {
          _convertClassesToStyle($video);
        }
      }

      videos.toggleClass('fr-draggable', editor.opts.videoMove);
    }

    function _init() {
      if (editor.opts.videoResponsive) {
        editor.opts.videoResize = false;
      }

      _initEvents();

      if (editor.helpers.isMobile()) {
        editor.events.$on(editor.$el, 'touchstart', 'span.fr-video', function () {
          touchScroll = false;
        });
        editor.events.$on(editor.$el, 'touchmove', function () {
          touchScroll = true;
        });
      }

      editor.events.on('html.set', _refreshVideoList);

      _refreshVideoList();

      editor.events.$on(editor.$el, 'mousedown', 'span.fr-video', function (e) {
        e.stopPropagation(); // initialize drag and drop on blocks for traditional browsers

        if (editor.browser.msie || editor.browser.edge) {
          e.target.dragDrop();

          _edit.call(this, e);
        }
      });
      editor.events.$on(editor.$el, 'click touchend', 'span.fr-video', function (e) {
        if ($(this).parents('[contenteditable]').not('.fr-element').not('.fr-img-caption').not('body').first().attr('contenteditable') == 'false') return true;

        _edit.call(this, e);
      });
      editor.events.on('keydown', function (e) {
        var key_code = e.which;

        if ($current_video && (key_code == FE.KEYCODE.BACKSPACE || key_code == FE.KEYCODE.DELETE)) {
          e.preventDefault();
          remove();
          editor.undo.saveStep();
          return false;
        }

        if ($current_video && key_code == FE.KEYCODE.ESC) {
          _exitEdit(true);

          e.preventDefault();
          return false;
        }

        if ($current_video && key_code != FE.KEYCODE.F10 && !editor.keys.isBrowserAction(e)) {
          e.preventDefault();
          return false;
        }
      }, true); // ESC from accessibility.

      editor.events.on('toolbar.esc', function () {
        if ($current_video) {
          editor.events.disableBlur();
          editor.events.focus();
          return false;
        }
      }, true); // focusEditor from accessibility.

      editor.events.on('toolbar.focusEditor', function () {
        if ($current_video) {
          return false;
        }
      }, true); // Make sure we don't leave empty tags.

      editor.events.on('keydown', function () {
        editor.$el.find('span.fr-video:empty').remove();
      });

      if (editor.$wp) {
        _syncVideos();

        editor.events.on('contentChanged', _syncVideos);
      }

      _initInsertPopup(true);

      _initSizePopup(true);
    }
    /**
     * Place selection around current video.
     */


    function _selectVideo() {
      if ($current_video) {
        editor.selection.clear();
        var range = editor.doc.createRange();
        range.selectNode($current_video.get(0));
        var selection = editor.selection.get();
        selection.addRange(range);
      }
    }
    /**
     * Get back to the video main popup.
     */


    function back() {
      if ($current_video) {
        editor.events.disableBlur();
        $current_video[0].click();
      } else {
        editor.events.disableBlur();
        editor.selection.restore();
        editor.events.enableBlur();
        editor.popups.hide('video.insert');
        editor.toolbar.showInline();
      }
    }
    /**
     * Set size based on the current video size.
     */


    function setSize(width, height) {
      if ($current_video) {
        var $popup = editor.popups.get('video.size');
        var $video_obj = $current_video.find('iframe, embed, video');
        $video_obj.css('width', width || $popup.find('input[name="width"]').val());
        $video_obj.css('height', height || $popup.find('input[name="height"]').val());
        if ($video_obj.get(0).style.width) $video_obj.removeAttr('width');
        if ($video_obj.get(0).style.height) $video_obj.removeAttr('height');
        $popup.find('input:focus').blur();
        setTimeout(function () {
          $current_video.trigger('click');
        }, editor.helpers.isAndroid() ? 50 : 0);
      }
    }

    function get() {
      return $current_video;
    }

    return {
      _init: _init,
      showInsertPopup: showInsertPopup,
      showLayer: showLayer,
      refreshByURLButton: refreshByURLButton,
      refreshEmbedButton: refreshEmbedButton,
      refreshUploadButton: refreshUploadButton,
      upload: upload,
      insertByURL: insertByURL,
      insertEmbed: insertEmbed,
      insert: insert,
      align: align,
      refreshAlign: refreshAlign,
      refreshAlignOnShow: refreshAlignOnShow,
      display: display,
      refreshDisplayOnShow: refreshDisplayOnShow,
      remove: remove,
      hideProgressBar: hideProgressBar,
      showSizePopup: showSizePopup,
      replace: replace,
      back: back,
      setSize: setSize,
      get: get,
      showProgressBar: showProgressBar
    };
  }; // Register the font size command.


  FE.RegisterCommand('insertVideo', {
    title: 'Insert Video',
    undo: false,
    focus: true,
    refreshAfterCallback: false,
    popup: true,
    callback: function callback() {
      if (!this.popups.isVisible('video.insert')) {
        this.video.showInsertPopup();
      } else {
        if (this.$el.find('.fr-marker').length) {
          this.events.disableBlur();
          this.selection.restore();
        }

        this.popups.hide('video.insert');
      }
    },
    plugin: 'video'
  }); // Add the font size icon.

  FE.DefineIcon('insertVideo', {
    NAME: 'video-camera',
    FA5NAME: 'camera',
    SVG_KEY: 'insertVideo'
  }); // Video by URL button inside the insert video popup.

  FE.DefineIcon('videoByURL', {
    NAME: 'link',
    SVG_KEY: 'insertLink'
  });
  FE.RegisterCommand('videoByURL', {
    title: 'By URL',
    undo: false,
    focus: false,
    toggle: true,
    callback: function callback() {
      this.video.showLayer('video-by-url');
    },
    refresh: function refresh($btn) {
      this.video.refreshByURLButton($btn);
    }
  }); // Video embed button inside the insert video popup.

  FE.DefineIcon('videoEmbed', {
    NAME: 'code',
    SVG_KEY: 'codeView'
  });
  FE.RegisterCommand('videoEmbed', {
    title: 'Embedded Code',
    undo: false,
    focus: false,
    toggle: true,
    callback: function callback() {
      this.video.showLayer('video-embed');
    },
    refresh: function refresh($btn) {
      this.video.refreshEmbedButton($btn);
    }
  }); // Video upload button inside the insert video popup.

  FE.DefineIcon('videoUpload', {
    NAME: 'upload',
    SVG_KEY: 'upload'
  });
  FE.RegisterCommand('videoUpload', {
    title: 'Upload Video',
    undo: false,
    focus: false,
    toggle: true,
    callback: function callback() {
      this.video.showLayer('video-upload');
    },
    refresh: function refresh($btn) {
      this.video.refreshUploadButton($btn);
    }
  });
  FE.RegisterCommand('videoInsertByURL', {
    undo: true,
    focus: true,
    callback: function callback() {
      this.video.insertByURL();
    }
  });
  FE.RegisterCommand('videoInsertEmbed', {
    undo: true,
    focus: true,
    callback: function callback() {
      this.video.insertEmbed();
    }
  }); // Video display.

  FE.DefineIcon('videoDisplay', {
    NAME: 'star',
    SVG_KEY: 'star'
  });
  FE.RegisterCommand('videoDisplay', {
    title: 'Display',
    type: 'dropdown',
    options: {
      inline: 'Inline',
      block: 'Break Text'
    },
    callback: function callback(cmd, val) {
      this.video.display(val);
    },
    refresh: function refresh($btn) {
      if (!this.opts.videoTextNear) $btn.addClass('fr-hidden');
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      this.video.refreshDisplayOnShow($btn, $dropdown);
    }
  }); // Video align.

  FE.DefineIcon('video-align', {
    NAME: 'align-left',
    SVG_KEY: 'align Left'
  });
  FE.DefineIcon('video-align-left', {
    NAME: 'align-left',
    SVG_KEY: 'alignLeft'
  });
  FE.DefineIcon('video-align-right', {
    NAME: 'align-right',
    SVG_KEY: 'alignRight'
  });
  FE.DefineIcon('video-align-center', {
    NAME: 'align-justify',
    SVG_KEY: 'alignJustify'
  }); // Video align.

  FE.DefineIcon('videoAlign', {
    NAME: 'align-center',
    SVG_KEY: 'alignCenter'
  });
  FE.RegisterCommand('videoAlign', {
    type: 'dropdown',
    title: 'Align',
    options: {
      left: 'Align Left',
      center: 'None',
      right: 'Align Right'
    },
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = FE.COMMANDS.videoAlign.options;

      for (var val in options) {
        if (options.hasOwnProperty(val)) {
          c += '<li role="presentation"><a class="fr-command fr-title" tabIndex="-1" role="option" data-cmd="videoAlign" data-param1="' + val + '" title="' + this.language.translate(options[val]) + '">' + this.icon.create('video-align-' + val) + '<span class="fr-sr-only">' + this.language.translate(options[val]) + '</span></a></li>';
        }
      }

      c += '</ul>';
      return c;
    },
    callback: function callback(cmd, val) {
      this.video.align(val);
    },
    refresh: function refresh($btn) {
      this.video.refreshAlign($btn);
    },
    refreshOnShow: function refreshOnShow($btn, $dropdown) {
      this.video.refreshAlignOnShow($btn, $dropdown);
    }
  }); // Video replace.

  FE.DefineIcon('videoReplace', {
    NAME: 'exchange',
    FA5NAME: 'exchange-alt',
    SVG_KEY: 'replaceImage'
  });
  FE.RegisterCommand('videoReplace', {
    title: 'Replace',
    undo: false,
    focus: false,
    popup: true,
    refreshAfterCallback: false,
    callback: function callback() {
      this.video.replace();
    }
  }); // Video remove.

  FE.DefineIcon('videoRemove', {
    NAME: 'trash',
    SVG_KEY: 'remove'
  });
  FE.RegisterCommand('videoRemove', {
    title: 'Remove',
    callback: function callback() {
      this.video.remove();
    }
  }); // Video size.

  FE.DefineIcon('videoSize', {
    NAME: 'arrows-alt',
    SVG_KEY: 'imageSize'
  });
  FE.RegisterCommand('videoSize', {
    undo: false,
    focus: false,
    popup: true,
    title: 'Change Size',
    callback: function callback() {
      this.video.showSizePopup();
    }
  }); // Video back.

  FE.DefineIcon('videoBack', {
    NAME: 'arrow-left',
    SVG_KEY: 'back'
  });
  FE.RegisterCommand('videoBack', {
    title: 'Back',
    undo: false,
    focus: false,
    back: true,
    callback: function callback() {
      this.video.back();
    },
    refresh: function refresh($btn) {
      var $current_video = this.video.get();

      if (!$current_video && !this.opts.toolbarInline) {
        $btn.addClass('fr-hidden');
        $btn.next('.fr-separator').addClass('fr-hidden');
      } else {
        $btn.removeClass('fr-hidden');
        $btn.next('.fr-separator').removeClass('fr-hidden');
      }
    }
  });
  FE.RegisterCommand('videoDismissError', {
    title: 'OK',
    undo: false,
    callback: function callback() {
      this.video.hideProgressBar(true);
    }
  });
  FE.RegisterCommand('videoSetSize', {
    undo: true,
    focus: false,
    title: 'Update',
    refreshAfterCallback: false,
    callback: function callback() {
      this.video.setSize();
    }
  });

  Object.assign(FE.DEFAULTS, {
    wordDeniedTags: [],
    wordDeniedAttrs: [],
    wordAllowedStyleProps: ['font-family', 'font-size', 'background', 'color', 'width', 'text-align', 'vertical-align', 'background-color', 'padding', 'margin', 'height', 'margin-top', 'margin-left', 'margin-right', 'margin-bottom', 'text-decoration', 'font-weight', 'font-style', 'text-indent', 'border', 'border-.*', 'line-height', 'list-style-type'],
    wordPasteModal: true,
    wordPasteKeepFormatting: true
  });

  FE.PLUGINS.wordPaste = function (editor) {
    var $ = editor.$;
    var $modal;
    var modal_id = 'word_paste';
    var clipboard_html;
    var _v_shapes_map = {};
    /*
     * Init Word Paste.
     */

    function _init() {
      editor.events.on('paste.wordPaste', function (html) {
        clipboard_html = html;

        if (editor.opts.wordPasteModal) {
          _showModal();
        } else {
          clean(editor.opts.wordPasteKeepFormatting);
        }

        return false;
      });
    }
    /*
     * Build html body.
     */


    function _buildModalBody() {
      // Begin body.
      var body = '<div class="fr-word-paste-modal" style="padding: 20px 20px 10px 20px;">';
      body += '<p style="text-align: left;">' + editor.language.translate('The pasted content is coming from a Microsoft Word document. Do you want to keep the format or clean it up?') + '</p>';
      body += '<div style="text-align: right; margin-top: 50px;"><button class="fr-remove-word fr-command">' + editor.language.translate('Clean') + '</button> <button class="fr-keep-word fr-command">' + editor.language.translate('Keep') + '</button></div>'; // End body.

      body += '</div>';
      return body;
    }
    /*
     * Show modal.
     */


    function _showModal() {
      if (!$modal) {
        var head = '<h4><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 74.95 73.23" style="height: 25px; vertical-align: text-bottom; margin-right: 5px; display: inline-block"><defs><style>.a{fill:#2a5699;}.b{fill:#fff;}</style></defs><path class="a" d="M615.15,827.22h5.09V834c9.11.05,18.21-.09,27.32.05a2.93,2.93,0,0,1,3.29,3.25c.14,16.77,0,33.56.09,50.33-.09,1.72.17,3.63-.83,5.15-1.24.89-2.85.78-4.3.84-8.52,0-17,0-25.56,0v6.81h-5.32c-13-2.37-26-4.54-38.94-6.81q0-29.8,0-59.59c13.05-2.28,26.11-4.5,39.17-6.83Z" transform="translate(-575.97 -827.22)"/><path class="b" d="M620.24,836.59h28.1v54.49h-28.1v-6.81h22.14v-3.41H620.24v-4.26h22.14V873.2H620.24v-4.26h22.14v-3.41H620.24v-4.26h22.14v-3.41H620.24v-4.26h22.14v-3.41H620.24V846h22.14v-3.41H620.24Zm-26.67,15c1.62-.09,3.24-.16,4.85-.25,1.13,5.75,2.29,11.49,3.52,17.21,1-5.91,2-11.8,3.06-17.7,1.7-.06,3.41-.15,5.1-.26-1.92,8.25-3.61,16.57-5.71,24.77-1.42.74-3.55,0-5.24.09-1.13-5.64-2.45-11.24-3.47-16.9-1,5.5-2.29,10.95-3.43,16.42q-2.45-.13-4.92-.3c-1.41-7.49-3.07-14.93-4.39-22.44l4.38-.18c.88,5.42,1.87,10.82,2.64,16.25,1.2-5.57,2.43-11.14,3.62-16.71Z" transform="translate(-575.97 -827.22)"/></svg> ' + editor.language.translate('Word Paste Detected') + '</h4>';

        var body = _buildModalBody();

        var modalHash = editor.modals.create(modal_id, head, body);
        var $body = modalHash.$body;
        $modal = modalHash.$modal;
        modalHash.$modal.addClass('fr-middle');
        editor.events.bindClick($body, 'button.fr-remove-word', function () {
          var inst = $modal.data('instance') || editor;
          inst.wordPaste.clean();
        });
        editor.events.bindClick($body, 'button.fr-keep-word', function () {
          var inst = $modal.data('instance') || editor;
          inst.wordPaste.clean(true);
        }); // Resize help modal on window resize.

        editor.events.$on($(editor.o_win), 'resize', function () {
          editor.modals.resize(modal_id);
        });
      } // Show modal.


      editor.modals.show(modal_id); // Modal may not fit window size.

      editor.modals.resize(modal_id);
    }
    /*
     * Hide modal.
     */


    function _hideModal() {
      editor.modals.hide(modal_id);
    }
    /*
     * Word paste cleanup.
     */


    function clean(keep_formatting) {
      var wordAllowedStylePropsBackup = editor.opts.wordAllowedStyleProps;

      if (!keep_formatting) {
        editor.opts.wordAllowedStyleProps = [];
      } // Firefox paste.


      if (clipboard_html.indexOf('<colgroup>') === 0) {
        clipboard_html = '<table>' + clipboard_html + '</table>';
      } // Replace spaces.


      clipboard_html = clipboard_html.replace(/<span[\n\r ]*style='mso-spacerun:yes'>([\r\n\u00a0 ]*)<\/span>/g, function (str, match) {
        var spaces = '';
        var i = 0;

        while (i++ < match.length) {
          spaces += '&nbsp;';
        }

        return spaces;
      });
      clipboard_html = _wordClean(clipboard_html, editor.paste.getRtfClipboard()); // Remove unwanted spaces.

      var div = editor.doc.createElement('DIV');
      div.innerHTML = clipboard_html;
      editor.html.cleanBlankSpaces(div);
      clipboard_html = div.innerHTML;
      clipboard_html = editor.paste.cleanEmptyTagsAndDivs(clipboard_html); // Remove invisible space.

      clipboard_html = clipboard_html.replace(/\u200b/g, '');

      _hideModal(); // Clean the processed clipboard_html.


      editor.paste.clean(clipboard_html, true, true);
      editor.opts.wordAllowedStyleProps = wordAllowedStylePropsBackup;
    }
    /**
     * Remove a node. IE conpatible.
     */


    function _removeNode(node) {
      var parent = node.parentNode;

      if (!parent) {
        return;
      }

      node.parentNode.removeChild(node);
    }
    /*
     * Depth-first search traversing of the DOM.
     */


    function _traverse(node, callback) {
      // Process node.
      if (!callback(node)) {
        return;
      } // Expand node. Take its first child.


      var child = node.firstChild; // While all childs are traversed.

      while (child) {
        // Store the current child.
        var current_child = child; // Store the previous child.

        var previous_child = child.previousSibling; // Take next child.

        child = child.nextSibling; // Expand the current child.

        _traverse(current_child, callback); // An unwrap was made. Need to calculate again the next child.


        if (!current_child.previousSibling && !current_child.nextSibling && !current_child.parentNode && child && previous_child !== child.previousSibling && child.parentNode) {
          if (previous_child) {
            child = previous_child.nextSibling;
          } else {
            child = node.firstChild;
          }
        } // A list was created. Need to calculate again the next child.
        else if (!current_child.previousSibling && !current_child.nextSibling && !current_child.parentNode && child && !child.previousSibling && !child.nextSibling && !child.parentNode) {
            if (previous_child) {
              if (previous_child.nextSibling) {
                child = previous_child.nextSibling.nextSibling;
              } else {
                child = null;
              }
            } else {
              if (node.firstChild) {
                child = node.firstChild.nextSibling;
              }
            }
          }
      }
    }
    /*
     * Check if a node is a list. TODO: use Regex.
     */


    function _isList(node) {
      // Check if it has mso-list:l in its style attribute.
      if (!(node.getAttribute('style') && /mso-list:[\s]*l/gi.test(node.getAttribute('style').replace(/\n/gi, '')))) {
        return false;
      } // Using try-catch to skip undefined checking.


      try {
        // Check mso-list.
        if (!node.querySelector('[style="mso-list:Ignore"]')) {
          if (node.outerHTML && node.outerHTML.indexOf('<!--[if !supportLists]-->') >= 0) {
            return true;
          }

          return false;
        }
      } catch (e) {
        return false;
      }

      return true;
    }
    /*
     * Get list level based on level attribute from node style.
     */


    function _getListLevel(node) {
      return node.getAttribute('style').replace(/\n/gi, '').replace(/.*level([0-9]+?).*/gi, '$1');
    }
    /*
     * Get list content.
     */


    function _getListContent(node, head_style_hash) {
      var cloned_node = node.cloneNode(true); // Some lists might be wrapped in a link. So we need to unwrap.
      // if (cloned_node.firstElementChild && cloned_node.firstElementChild.tagName === 'A') {
      //   cloned_node = cloned_node.firstElementChild
      // }
      // Heading list.

      if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].indexOf(node.tagName) !== -1) {
        var heading = document.createElement(node.tagName.toLowerCase());
        heading.setAttribute('style', node.getAttribute('style'));
        heading.innerHTML = cloned_node.innerHTML;
        cloned_node.innerHTML = heading.outerHTML;
      } // Clean node recursively.


      _traverse(cloned_node, function (node) {
        if (node.nodeType == Node.COMMENT_NODE && (editor.browser.msie || editor.browser.safari || editor.browser.edge)) {
          try {
            if (node.data === '[if !supportLists]') {
              node = node.nextSibling;

              while (node && node.nodeType !== Node.COMMENT_NODE) {
                var tmp = node.nextSibling;
                node.parentNode.removeChild(node);
                node = tmp;
              }

              if (node && node.nodeType == Node.COMMENT_NODE) {
                node.parentNode.removeChild(node);
              }
            }
          } catch (ex) {}
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          // Skip the first child which is an mso-list:Ignore node.
          if (node.getAttribute('style') === 'mso-list:Ignore') {
            node.parentNode.removeChild(node);
          }

          node.setAttribute('style', _getAllowedListStyles(node));

          _cleanElement(node, head_style_hash);
        }

        return true;
      }); // Take content.


      var content = cloned_node.innerHTML; // Replace comments.

      content = content.replace(/<!--[\s\S]*?-->/gi, '');
      return content;
    }
    /*
     * Build ol/ul list.
     */


    function _buildList(node, head_style_hash, level) {
      // Check ol/ul.
      var order_regex = /[0-9a-zA-Z]./gi;
      var is_ordered = false;
      var next_order;
      var prev_order;
      var previous_element_sibling;
      var list_type_node = node.querySelector('span[style="mso-list:Ignore"]');
      var contents;
      var listObj;
      var list_tag;
      var listStyle; // Checking the list is ordered or unordered

      if (list_type_node) {
        is_ordered = is_ordered || order_regex.test(list_type_node.textContent);
      } // Get the list type
      // const list_tag = is_ordered ? 'ol' : 'ul'


      if (is_ordered == true) {
        var listType = list_type_node.textContent.trim().split('.')[0];

        if (listType == 'a') {
          listStyle = 'lower-alpha;';
        } else if (listType == 'A') {
          listStyle = 'upper-alpha;';
        } else if (listType == '1') {
          listStyle = 'decimal;';
        } else if (listType == 'i') {
          listStyle = 'lower-roman;';
        } else if (listType == 'I') {
          listStyle = 'upper-roman;';
        } else if (listType == 'o') {
          listStyle = 'circle;';
        }

        listStyle = 'list-style-type: ' + listStyle;
        list_tag = 'ol';
      } else {
        list_tag = 'ul';
      } // creating new list


      var s = listStyle ? '<' + list_tag + ' style = "' + listStyle + '">' : '<' + list_tag + '>';

      while (node) {
        // Stop at first sibling that is not a list.
        if (!_isList(node)) {
          // Skip bookmarks.
          if (node.outerHTML && node.outerHTML.indexOf('mso-bookmark') > 0 && (node.textContent || '').length == 0) {
            node = node.nextElementSibling;
            continue;
          }

          break;
        } // getting level of next node


        var next_level = _getListLevel(node); // Set the level if it's the first level or use the same


        level = level || next_level; // Create new list if next node level is greater than current one

        if (next_level > level) {
          listObj = _buildList(node, head_style_hash, next_level);
          s += listObj.el.outerHTML; // Getting the subsequent node after creating new list

          node = listObj.currentNode; // Need to start over to check if next node might be on same level

          continue;
        } else if (next_level < level) {
          // Lower level found. Current list is done.
          break;
        } else {
          // Checked list tag if levels are same.(https://github.com/froala/wysiwyg-editor/issues/3088)
          // Checking the order of next element.
          if (node.firstElementChild && node.firstElementChild.firstElementChild && node.firstElementChild.firstElementChild.firstChild) {
            order_regex.lastIndex = 0;
            next_order = order_regex.test(node.firstElementChild.firstElementChild.firstChild.data || node.firstElementChild.firstElementChild.firstChild.firstChild && node.firstElementChild.firstElementChild.firstChild.firstChild.data || '');
          } // Checking the order of current element.


          if (previous_element_sibling && previous_element_sibling.firstElementChild && previous_element_sibling.firstElementChild.firstElementChild && previous_element_sibling.firstElementChild.firstElementChild.firstChild) {
            order_regex.lastIndex = 0;
            prev_order = order_regex.test(previous_element_sibling.firstElementChild.firstElementChild.firstChild.data || previous_element_sibling.firstElementChild.firstElementChild.firstChild.firstChild && previous_element_sibling.firstElementChild.firstElementChild.firstChild.firstChild.data || '');
          } // If levels are same,we are comparing the order of the next element.
          // If the order is same it will append the element in existing list else will create a new list.


          if (prev_order === undefined || prev_order === next_order) {
            contents = _getListContent(node, head_style_hash);
            s += '<li>' + contents + '</li>';
          } else {
            listObj = _buildList(node, head_style_hash, next_level);
            s += listObj.el.outerHTML;
            node = listObj.currentNode;
          }
        } // Storing the next sibling in temporary variable


        var tmp = node && node.nextElementSibling; // Check if node is there get the previous element sibling

        if (tmp) {
          previous_element_sibling = tmp.previousElementSibling;
        } // Remove the used node


        node && node.parentNode && node.parentNode.removeChild(node); // Restore the next sibling to node

        node = tmp;
      } // Finish list


      s += '</' + list_tag + '>'; // Convert string to node element.

      var div = document.createElement('div');
      div.innerHTML = s;
      var element = div.firstElementChild; // Returning list element and current node

      return {
        el: element,
        currentNode: node
      };
    }

    function _getAllowedListStyles(node) {
      var styles = '';
      var allowedStyles = ['line-height', 'font-family', 'font-size', 'color', 'background'];
      var parentStyles = node.getAttribute('style');

      if (parentStyles) {
        allowedStyles.forEach(function (style) {
          var foundVal = parentStyles.match(new RegExp(style + ':.*;'));

          if (foundVal) {
            styles += foundVal[0] + ';';
          }
        });
      }

      return styles;
    }
    /*
     * Change tag name of an element.
     */


    function _changeTagName(old_node, tag_name) {
      var new_node = document.createElement(tag_name);

      for (var i = 0; i < old_node.attributes.length; i++) {
        var attribute = old_node.attributes[i].name;
        new_node.setAttribute(attribute, old_node.getAttribute(attribute));
      }

      new_node.innerHTML = old_node.innerHTML;
      old_node.parentNode.replaceChild(new_node, old_node);
      return new_node;
    }
    /*
     * Clean tr element.
     */


    function _cleanTr(tr, head_style_hash) {
      // Clean tr attributes.
      editor.node.clearAttributes(tr); // Get first child.

      var child = tr.firstElementChild; // Total table width.

      var total_width = 0; // Tell if at least one child has a missing width.

      var missing_width = false; // Width attribute.

      var width_attr = null; // Clean td childs and calculate total table width.

      while (child) {
        // Cleanup w: tags.
        if (child.firstElementChild && child.firstElementChild.tagName.indexOf('W:') !== -1) {
          child.innerHTML = child.firstElementChild.innerHTML;
        } // Add width to total.


        width_attr = child.getAttribute('width');

        if (!width_attr && !missing_width) {
          missing_width = true;
        }

        total_width += parseInt(width_attr, 10); // Replace to <br> childs that are empty or &nbsp.

        if (!child.firstChild || child.firstChild && child.firstChild.data === FE.UNICODE_NBSP) {
          if (child.firstChild) {
            _removeNode(child.firstChild);
          }

          child.innerHTML = '<br>';
        }

        var td_child = child.firstElementChild; // If child has more than one children, it means that every child has its own alignment.

        var has_single_child = child.children.length === 1; // Change p to span or div and clean alignment on every element child.

        while (td_child) {
          if (td_child.tagName === 'P' && !_isList(td_child)) {
            // Set alignment to td parent.
            if (has_single_child) {
              _cleanAlignment(td_child);
            }
          } // Move to next element sibling.


          td_child = td_child.nextElementSibling;
        } // Add styles from head.


        if (head_style_hash) {
          // Style from .xl classes.
          // Get class from child.
          var class_attr = child.getAttribute('class');

          if (class_attr) {
            class_attr = _normalizeAttribute(class_attr); // Match xl class.

            var class_matches = class_attr.match(/xl[0-9]+/gi);

            if (class_matches) {
              var xl_class = class_matches[0];
              var dot_xl_class = '.' + xl_class;

              if (head_style_hash[dot_xl_class]) {
                _appendStyle(child, head_style_hash[dot_xl_class]);
              }
            }
          } // Style from td.


          if (head_style_hash.td) {
            _appendStyle(child, head_style_hash.td);
          }
        }

        var style = child.getAttribute('style');

        if (style) {
          style = _normalizeAttribute(style); // Add semicolon, if it is missing, to the end of current style.

          if (style && style.slice(-1) !== ';') {
            style += ';';
          }
        } // Store valign attribute.


        var valign = child.getAttribute('valign');

        if (!valign && style) {
          var valign_matches = style.match(/vertical-align:.+?[; "]{1,1}/gi);

          if (valign_matches) {
            valign = valign_matches[valign_matches.length - 1].replace(/vertical-align:(.+?)[; "]{1,1}/gi, '$1');
          }
        } // Store text-align style attribute.


        var halign = null;

        if (style) {
          var halign_matches = style.match(/text-align:.+?[; "]{1,1}/gi);

          if (halign_matches) {
            halign = halign_matches[halign_matches.length - 1].replace(/text-align:(.+?)[; "]{1,1}/gi, '$1');
          }

          if (halign === 'general') {
            halign = null;
          }
        } // Store background color style attribute.


        var background_color = null;

        if (style) {
          var background_matches = style.match(/background:.+?[; "]{1,1}/gi);

          if (background_matches) {
            background_color = background_matches[background_matches.length - 1].replace(/background:(.+?)[; "]{1,1}/gi, '$1');
          }
        } // Store colspan.


        var colspan = child.getAttribute('colspan'); // Store rowspan.

        var rowspan = child.getAttribute('rowspan'); // Restore colspan.

        if (colspan) {
          child.setAttribute('colspan', colspan);
        } // Restore rowspan.


        if (rowspan) {
          child.setAttribute('rowspan', rowspan);
        } // Add valign to style.


        if (valign) {
          child.style['vertical-align'] = valign;
        } // Add horizontal align to style.


        if (halign) {
          child.style['text-align'] = halign;
        } // Add background color to style.


        if (background_color) {
          child.style['background-color'] = background_color;
        } // Set the width again.


        if (width_attr) {
          child.setAttribute('width', width_attr);
        } // Move to next sibling.


        child = child.nextElementSibling;
      } // Get first child again.


      child = tr.firstElementChild; // Set the width in percentage to every child.

      while (child) {
        width_attr = child.getAttribute('width');

        if (missing_width) {
          // Remove width.
          child.removeAttribute('width');
        } else {
          // Set the width considering that every child has equal widths.
          child.setAttribute('width', parseInt(width_attr, 10) * 100 / total_width + '%');
        } // Move to next sibling.


        child = child.nextElementSibling;
      }
    }
    /*
     * Clean align attribute.
     */


    function _cleanAlignment(el) {
      var align = el.getAttribute('align');

      if (align) {
        el.style['text-align'] = align;
        el.removeAttribute('align');
      }
    }
    /*
     * Clean up atribute.
     */


    function _normalizeAttribute(attribute) {
      return attribute.replace(/\n|\r|\n\r|&quot;/g, '');
    }
    /*
     * Append style to element.
     */


    function _appendStyle(el, style, last) {
      if (!style) {
        return;
      } // Get current element style.


      var old_style = el.getAttribute('style'); // Add semicolon, if it is missing, to the end of current style.

      if (old_style && old_style.slice(-1) !== ';') {
        old_style += ';';
      } // Add semicolon, if it is missing, to the end of current style.


      if (style && style.slice(-1) !== ';') {
        style += ';';
      } // Remove newlines.


      style = style.replace(/\n/gi, ''); // Append at the begining or at the end.

      var new_style = null;

      if (last) {
        new_style = (old_style || '') + style;
      } else {
        new_style = style + (old_style || '');
      }

      el.setAttribute('style', new_style);
    }
    /*
     * Delete duplicate attributes found on style. Keep the last one.
     */


    function _cleanStyleDuplicates(el) {
      var style = el.getAttribute('style');

      if (!style) {
        return;
      }

      style = _normalizeAttribute(style); // Add semicolon, if it is missing, to the end of style.

      if (style && style.slice(-1) !== ';') {
        style += ';';
      } // Get styles: attr:value


      var style_list = style.match(/(^|\S+?):.+?;{1,1}/gi);

      if (!style_list) {
        return;
      } // Key = attribute. Value = attribute's value. Duplicate keys will be overrided.


      var style_hash = {};

      for (var i = 0; i < style_list.length; i++) {
        var style_list_item = style_list[i];
        var splited_style = style_list_item.split(':');

        if (splited_style.length !== 2) {
          continue;
        } // Add style to hash without text-align on span.


        if (!(splited_style[0] === 'text-align' && el.tagName === 'SPAN')) {
          style_hash[splited_style[0]] = splited_style[1];
        }
      } // Create the new style without duplicates.


      var new_style = '';

      for (var attr in style_hash) {
        if (style_hash.hasOwnProperty(attr)) {
          // Change font-size form pt to px
          if (attr === 'font-size' && style_hash[attr].slice(-3) === 'pt;') {
            var number = null;

            try {
              number = parseFloat(style_hash[attr].slice(0, -3), 10);
            } catch (e) {
              number = null;
            }

            if (number) {
              number = Math.round(1.33 * number);
              style_hash[attr] = number + 'px;';
            }
          }

          new_style += attr + ':' + style_hash[attr];
        }
      }

      if (new_style) {
        el.setAttribute('style', new_style);
      }
    }
    /*
     * Convert a hex string to base64.
     */


    function _hexToBase64(hex) {
      var hexa_chars = hex.match(/[0-9a-f]{2}/gi);
      var dec_chars = [];

      for (var i = 0; i < hexa_chars.length; i++) {
        dec_chars.push(String.fromCharCode(parseInt(hexa_chars[i], 16)));
      }

      var dec = dec_chars.join('');
      return btoa(dec);
    }

    var _rtf_map = null;

    function _getRtfData(rtf, letter, p_type) {
      var imgs = rtf.split(p_type);

      for (var i = 1; i < imgs.length; i++) {
        var img_data = imgs[i];
        img_data = img_data.split('shplid');

        if (img_data.length > 1) {
          img_data = img_data[1];
          var id = '';
          var t = 0;

          while (t < img_data.length) {
            if (img_data[t] === '\\' || img_data[t] === '{' || img_data[t] === ' ' || img_data[t] === '\r' || img_data[t] === '\n') {
              break;
            }

            id += img_data[t];
            t++;
          }

          var bliptab_split = img_data.split('bliptag');

          if (bliptab_split && bliptab_split.length < 2) {
            continue;
          }

          var image_type = null;

          if (bliptab_split[0].indexOf('pngblip') !== -1) {
            image_type = 'image/png';
          } else if (bliptab_split[0].indexOf('jpegblip') !== -1) {
            image_type = 'image/jpeg';
          }

          if (!image_type) {
            continue;
          }

          var bracket_split = bliptab_split[1].split('}');

          if (bracket_split && bracket_split.length < 2) {
            continue;
          }

          var space_split = void 0;

          if (bracket_split.length > 2 && bracket_split[0].indexOf('blipuid') !== -1) {
            space_split = bracket_split[1].split(' ');
          } else {
            space_split = bracket_split[0].split(' ');

            if (space_split && space_split.length < 2) {
              continue;
            }

            space_split.shift();
          }

          var image_hex = space_split.join('');
          _rtf_map[letter + id] = {
            image_hex: image_hex,
            image_type: image_type
          };
        }
      }
    }

    function _buildRtfMap(rtf) {
      _rtf_map = {};

      _getRtfData(rtf, 'i', '\\shppict');

      _getRtfData(rtf, 's', '\\shp{');
    }
    /*
     * Clean HTML Image.
     */


    function _cleanImage(el, rtf) {
      if (!rtf) {
        return;
      } // vshapes_tag will identify the image in rtf.


      var vshapes_tag; // Image case.

      if (el.tagName === 'IMG') {
        // Get src.
        var src = el.getAttribute('src');

        if (!src || src.indexOf('file://') === -1) {
          return;
        } else if (src.indexOf('file://') === 0) {
          if (editor.helpers.isURL(el.getAttribute('alt'))) {
            el.setAttribute('src', el.getAttribute('alt'));
            return;
          }
        } // vshapes_tag will identify the image in rtf.


        vshapes_tag = _v_shapes_map[el.getAttribute('v:shapes')];

        if (!vshapes_tag) {
          vshapes_tag = el.getAttribute('v:shapes'); // Disregard formulas.

          if (el.parentNode && el.parentNode.parentNode && el.parentNode.parentNode.innerHTML.indexOf('msEquation') >= 0) {
            vshapes_tag = null;
          }
        }
      } else {
        vshapes_tag = el.parentNode.getAttribute('o:spid');
      }

      el.removeAttribute('height');

      if (!vshapes_tag) {
        return;
      }

      _buildRtfMap(rtf);

      var img_data = _rtf_map[vshapes_tag.substring(7)];

      if (img_data) {
        // Convert image hex to base64.
        var image_base64 = _hexToBase64(img_data.image_hex); // Build data uri.


        var data_uri = 'data:' + img_data.image_type + ';base64,' + image_base64;

        if (el.tagName === 'IMG') {
          el.src = data_uri;
          el.setAttribute('data-fr-image-pasted', true);
        } else {
          $(el.parentNode).before('<img data-fr-image-pasted="true" src="' + data_uri + '" style="' + el.parentNode.getAttribute('style') + '">').remove();
        }
      }
    }
    /*
     * Clean element.
     */


    function _cleanElement(el, head_style_hash) {
      var tag_name = el.tagName;
      var tag_name_lower_case = tag_name.toLowerCase(); // Check if we need to change a tag. Tags should be changed only from parent.

      if (el.firstElementChild) {
        // Change i to em.
        if (el.firstElementChild.tagName === 'I') {
          _changeTagName(el.firstElementChild, 'em'); // Change b to strong.

        } else if (el.firstElementChild.tagName === 'B') {
          _changeTagName(el.firstElementChild, 'strong');
        }
      } // Remove no needed tags.


      var word_tags = ['SCRIPT', 'APPLET', 'EMBED', 'NOFRAMES', 'NOSCRIPT'];

      if (word_tags.indexOf(tag_name) !== -1) {
        _removeNode(el);

        return false;
      } // Check single spaces.
      // if (tag_name === 'O:P' && el.innerHTML === '&nbsp') {
      //   el.innerHTML = FE.INVISIBLE_SPACE
      // }
      // Remove tags but keep content.


      var ignore_tags = ['META', 'LINK', 'XML', 'ST1:', 'O:', 'W:', 'FONT'];

      for (var i = 0; i < ignore_tags.length; i++) {
        if (tag_name.indexOf(ignore_tags[i]) !== -1) {
          if (el.innerHTML) {
            el.outerHTML = el.innerHTML;

            _removeNode(el);

            return false;
          } else {
            // Remove if does not have content.
            _removeNode(el);

            return false;
          }
        }
      } // Add class style from head.


      if (tag_name !== 'TD') {
        var class_attr = el.getAttribute('class') || 'MsoNormal';

        if (head_style_hash && class_attr) {
          class_attr = _normalizeAttribute(class_attr);
          var class_contents = class_attr.split(' '); // All classes.

          for (var _i = 0; _i < class_contents.length; _i++) {
            var class_content = class_contents[_i]; // Create style attributes list.

            var style_attrs = []; // Only classes.

            var style_attr = '.' + class_content;
            style_attrs.push(style_attr); // Classes under tag.

            style_attr = tag_name_lower_case + style_attr;
            style_attrs.push(style_attr);

            for (var j = 0; j < style_attrs.length; j++) {
              if (head_style_hash[style_attrs[j]]) {
                _appendStyle(el, head_style_hash[style_attrs[j]]);
              }
            }
          }

          el.removeAttribute('class');
        } // Add tag style from head.


        if (head_style_hash && head_style_hash[tag_name_lower_case]) {
          _appendStyle(el, head_style_hash[tag_name_lower_case]);
        }
      } // Wrap paragraphs inner html in a span.


      var paragraph_tag_list = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE'];

      if (paragraph_tag_list.indexOf(tag_name) !== -1) {
        // Set style from head.
        var el_class = el.getAttribute('class');

        if (el_class) {
          if (head_style_hash && head_style_hash[tag_name.toLowerCase() + '.' + el_class]) {
            _appendStyle(el, head_style_hash[tag_name.toLowerCase() + '.' + el_class]);
          } // Remove mso values from class.


          if (el_class.toLowerCase().indexOf('mso') !== -1) {
            var cleaned_class = _normalizeAttribute(el_class);

            cleaned_class = cleaned_class.replace(/[0-9a-z-_]*mso[0-9a-z-_]*/gi, '');

            if (cleaned_class) {
              el.setAttribute('class', cleaned_class);
            } else {
              el.removeAttribute('class');
            }
          }
        } // keep only text-align in style.


        var paragraph_style = el.getAttribute('style');

        if (paragraph_style) {
          var paragraph_style_matches = paragraph_style.match(/text-align:.+?[; "]{1,1}/gi);

          if (paragraph_style_matches) {
            paragraph_style_matches[paragraph_style_matches.length - 1].replace(/(text-align:.+?[; "]{1,1})/gi, '$1');
          }
        }

        _cleanAlignment(el);
      } // Clean tr.


      if (tag_name === 'TR') {
        _cleanTr(el, head_style_hash);
      } // Clean empty links.


      if (tag_name === 'A' && !el.attributes.getNamedItem('href') && !el.attributes.getNamedItem('name') && el.innerHTML) {
        el.outerHTML = el.innerHTML;
      } // https://github.com/froala/wysiwyg-editor/issues/3272


      if (tag_name == 'A' && el.getAttribute('href') && el.querySelector('img')) {
        // removing empty span tags
        var spanTags = el.querySelectorAll('span');

        for (var _i2 = 0; _i2 < spanTags.length; _i2++) {
          if (!spanTags[_i2].innerText) {
            spanTags[_i2].outerHTML = spanTags[_i2].innerHTML;
          }
        }
      } // Keep empty TH and TD.


      if ((tag_name === 'TD' || tag_name === 'TH') && !el.innerHTML) {
        el.innerHTML = '<br>';
      } // Clean table.


      if (tag_name === 'TABLE') {
        el.style.width = el.style.width;
      } // Remove lang attribute.


      if (el.getAttribute('lang')) {
        el.removeAttribute('lang');
      } // Remove mso values from style.


      if (el.getAttribute('style') && el.getAttribute('style').toLowerCase().indexOf('mso') !== -1) {
        var cleaned_style = _normalizeAttribute(el.getAttribute('style'));

        cleaned_style = cleaned_style.replace(/[0-9a-z-_]*mso[0-9a-z-_]*:.+?(;{1,1}|$)/gi, '');

        if (cleaned_style) {
          el.setAttribute('style', cleaned_style);
        } else {
          el.removeAttribute('style');
        }
      }

      return true;
    }
    /*
     * Parse styles from head and return them into a hash.
     */


    function _parseHeadStyle(head) {
      var head_style_hash = {};
      var head_styles = head.getElementsByTagName('style');

      if (head_styles.length) {
        var head_style = head_styles[0]; // Match styles.

        var style_list = head_style.innerHTML.match(/[\S ]+\s+{[\s\S]+?}/gi);

        if (style_list) {
          for (var i = 0; i < style_list.length; i++) {
            var style = style_list[i]; // Get style attributes.

            var style_attrs = style.replace(/([\S ]+\s+){[\s\S]+?}/gi, '$1'); // Get style definitions.

            var style_definitions = style.replace(/[\S ]+\s+{([\s\S]+?)}/gi, '$1'); // Trim whitespaces.

            style_attrs = style_attrs.replace(/^[\s]|[\s]$/gm, '');
            style_definitions = style_definitions.replace(/^[\s]|[\s]$/gm, ''); // Trim new lines.

            style_attrs = style_attrs.replace(/\n|\r|\n\r/g, '');
            style_definitions = style_definitions.replace(/\n|\r|\n\r/g, '');
            var style_attrs_array = style_attrs.split(', '); // Add every attribute to hash.

            for (var j = 0; j < style_attrs_array.length; j++) {
              head_style_hash[style_attrs_array[j]] = style_definitions;
            }
          }
        }
      }

      return head_style_hash;
    }
    /**
     * Create a map with the ID for images.
     */


    function _getVShapes(html) {
      var splits = html.split('v:shape');

      for (var i = 1; i < splits.length; i++) {
        var split = splits[i];
        var id = split.split(' id="')[1];

        if (id && id.length > 1) {
          id = id.split('"')[0];
          var oid = split.split(' o:spid="')[1];

          if (oid && oid.length > 1) {
            oid = oid.split('"')[0];
            _v_shapes_map[id] = oid;
          }
        }
      }
    }
    /*
     * Clean HTML that was pasted from Word.
     */


    function _wordClean(html, rtf) {
      // Remove junk from outside html.
      if (html.indexOf('<html') >= 0) {
        html = html.replace(/[.\s\S\w\W<>]*(<html[^>]*>[.\s\S\w\W<>]*<\/html>)[.\s\S\w\W<>]*/i, '$1');
      } // Get the vshapes for images.


      _getVShapes(html); // Convert string into document.


      var parser = new DOMParser();
      var word_doc = parser.parseFromString(html, 'text/html');
      var head = word_doc.head;
      var body = word_doc.body; // Create style attrs hash.

      var head_style_hash = _parseHeadStyle(head); // Remove text nodes that do not contain non-whitespace characters and has new lines in them.


      _traverse(body, function (node) {
        if (node.nodeType === Node.TEXT_NODE && /\n|\u00a0|\r/.test(node.data)) {
          // https://github.com/froala/wysiwyg-editor/issues/3298
          // https://github.com/froala/wysiwyg-editor/issues/3327
          // if has no breaking space keep it
          // 2nd condition to check no break spaces
          if (!/\S| /.test(node.data) && !/[\u00a0]+/.test(node.data)) {
            // Keep single &nbsp
            if (node.data === FE.UNICODE_NBSP) {
              node.data = "\u200B";
              return true;
            }

            if (node.data.length === 1 && node.data.charCodeAt(0) === 10) {
              node.data = ' ';
              return true;
            }

            _removeNode(node);

            return false;
          } // Remove newlines.
          else {
              node.data = node.data.replace(/\n|\r/gi, ' ');
            }
        }

        return true;
      }); // Process images.


      _traverse(body, function (node) {
        // Element node.
        if (node.nodeType === Node.ELEMENT_NODE && (node.tagName === 'V:IMAGEDATA' || node.tagName === 'IMG')) {
          _cleanImage(node, rtf);
        }

        return true;
      }); // Process lists.


      var lists = body.querySelectorAll('ul > ul, ul > ol, ol > ul, ol > ol');

      for (var i = lists.length - 1; i >= 0; i--) {
        if (lists[i].previousElementSibling && lists[i].previousElementSibling.tagName === 'LI') {
          lists[i].previousElementSibling.appendChild(lists[i]);
        }
      } // Clean the body.


      _traverse(body, function (node) {
        // Text node.
        if (node.nodeType === Node.TEXT_NODE) {
          // https://github.com/froala/wysiwyg-editor/issues/1364.
          node.data = node.data.replace(/<br>(\n|\r)/gi, '<br>');
          return false;
        } // Element node.
        else if (node.nodeType === Node.ELEMENT_NODE) {
            // List found.
            if (_isList(node)) {
              // Keep the parent node and previous sibling because the node could be deleted in the list building.
              var parent_node = node.parentNode;
              var previous_sibling = node.previousSibling; // Get list element.

              var list_element = _buildList(node, head_style_hash).el; // Find the element to insert the new list before it.


              var before_element = null; // Current node was not the first.

              if (previous_sibling) {
                before_element = previous_sibling.nextSibling;
              } else {
                before_element = parent_node.firstChild;
              } // Insert before.


              if (before_element) {
                parent_node.insertBefore(list_element, before_element);
              } // Push to the end.
              else {
                  parent_node.appendChild(list_element);
                }

              return false;
            } else {
              if (node.tagName === 'FONT' && head_style_hash['.' + node.getAttribute('class')]) {
                node = _changeTagName(node, 'span');
              }

              return _cleanElement(node, head_style_hash);
            }
          } // Comment node.
          else if (node.nodeType === Node.COMMENT_NODE) {
              // removing the extra line breaks in comments
              if (node.data.indexOf('[if !supportLineBreakNewLine]') > -1) {
                var nextNode = node.nextSibling;

                while (nextNode) {
                  nextNode = node.nextSibling;
                  nextNode && _removeNode(nextNode);

                  if (nextNode.data && nextNode.data.indexOf('[endif]') > -1) {
                    nextNode = null;
                  }
                }
              }

              _removeNode(node);

              return false;
            }

        return true;
      }); // Remove empty tags and clean duplicate styles.


      _traverse(body, function (node) {
        // Element node.
        if (node.nodeType === Node.ELEMENT_NODE) {
          var tag_name = node.tagName; // Empty. Skip br tag.

          if (!node.innerHTML && ['BR', 'IMG'].indexOf(tag_name) === -1) {
            var parent = node.parentNode; // Remove recursively.

            while (parent) {
              _removeNode(node);

              node = parent; // Stop when non-empty element is found.

              if (node.innerHTML) {
                break;
              }

              parent = node.parentNode;
            }

            return false;
          } else {
            _cleanStyleDuplicates(node);
          }
        }

        return true;
      }); // https://github.com/froala/wysiwyg-editor/issues/3098, Remove empty anchor tags


      _traverse(body, function (node) {
        // remove anchor tag if it doesn't have url
        if (node && node.nodeName === 'A' && node.href === '') {
          // replace parent a tag with its child nodes
          var fragment = document.createDocumentFragment();

          while (node.firstChild) {
            fragment.appendChild(node.firstChild);
          }

          node.parentNode.replaceChild(fragment, node);
        }

        return true;
      }); // Converd document to string.


      var word_doc_string = body.outerHTML; // Clean HTML.

      var htmlAllowedStylePropsCopy = editor.opts.htmlAllowedStyleProps;
      editor.opts.htmlAllowedStyleProps = editor.opts.wordAllowedStyleProps;
      word_doc_string = editor.clean.html(word_doc_string, editor.opts.wordDeniedTags, editor.opts.wordDeniedAttrs, false);
      editor.opts.htmlAllowedStyleProps = htmlAllowedStylePropsCopy;
      return word_doc_string;
    }

    return {
      _init: _init,
      clean: clean
    };
  };

  // Plugins

})));
//# sourceMappingURL=plugins.pkgd.js.map
