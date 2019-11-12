/*!
 * froala_editor v3.0.6 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms/
 * Copyright 2014-2019 Froala Labs
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.FroalaEditor = factory());
}(this, (function () { 'use strict';

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

  // Closest polyfill.
  if (!Element.prototype.matches) Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  if (!Element.prototype.closest) Element.prototype.closest = function (s) {
    var el = this;
    if (!document.documentElement.contains(el)) return null;

    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);

    return null;
  }; // Matches polyfill.

  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.matchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector || Element.prototype.webkitMatchesSelector || function (s) {
      var matches = (this.document || this.ownerDocument).querySelectorAll(s),
          i = matches.length;

      while (--i >= 0 && matches.item(i) !== this) {}

      return i > -1;
    };
  } // isArray polyfill.


  if (!Array.isArray) {
    Array.isArray = function (arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    };
  } // Object.assign


  if (typeof Object.assign != 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
      value: function assign(target, varArgs) {

        if (target == null) {
          // TypeError if undefined or null
          throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
          var nextSource = arguments[index];

          if (nextSource != null) {
            // Skip over if undefined or null
            for (var nextKey in nextSource) {
              // Avoid bugs when hasOwnProperty is shadowed
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }

        return to;
      },
      writable: true,
      configurable: true
    });
  }

  (function _scopeShim() {
    // Match usage of scope
    var scopeRE = /^\s*:scope/gi;
    var scopeREComma = /,\s*:scope/gi; // A temporary element to query against for elements not currently in the DOM
    // We'll also use this element to test for :scope support

    var container = document.createElement('div'); // Overrides

    function overrideNodeMethod(prototype, methodName) {
      // Store the old method for use later
      var oldMethod = prototype[methodName]; // Override the method

      prototype[methodName] = function (query) {
        var nodeList;
        var gaveId = false;
        var gaveContainer = false;

        if (query && (query.match(scopeRE) || query.match(scopeREComma))) {
          if (!this.parentNode) {
            // Add to temporary container
            container.appendChild(this);
            gaveContainer = true;
          }

          var parentNode = this.parentNode;

          if (!this.id) {
            // Give temporary ID
            this.id = "rootedQuerySelector_id_".concat(new Date().getTime());
            gaveId = true;
          } // Find elements against parent node
          // Replace :scope with node's id


          nodeList = oldMethod.call(parentNode, query.replace(scopeRE, "#".concat(this.id)).replace(scopeREComma, ",#".concat(this.id))); // Reset the ID

          if (gaveId) {
            this.id = '';
          } // Remove from temporary container


          if (gaveContainer) {
            container.removeChild(this);
          }

          return nodeList;
        } // No immediate child selector used


        return oldMethod.call(this, query);
      };
    } // Check if the browser supports :scope


    try {
      // Browser supports :scope, do nothing
      container.querySelectorAll(':scope *');
    } catch (e) {
      // Browser doesn't support :scope, add polyfill
      overrideNodeMethod(Element.prototype, 'querySelector');
      overrideNodeMethod(Element.prototype, 'querySelectorAll');
      overrideNodeMethod(HTMLElement.prototype, 'querySelector');
      overrideNodeMethod(HTMLElement.prototype, 'querySelectorAll');
    }
  })();

  var defaults = {
    DEFAULTS: {
      initOnClick: false,
      pluginsEnabled: null
    },
    MODULES: {},
    PLUGINS: {},
    VERSION: '3.0.6',
    INSTANCES: [],
    OPTS_MAPPING: {},
    SHARED: {},
    ID: 0
  };

  function FroalaEditor(selector, options, initCallback) {
    if (typeof selector === 'string') {
      var els = document.querySelectorAll(selector);

      if (options && options.iframe_document) {
        els = options.iframe_document.querySelectorAll(selector);
      }

      var inst = [];

      for (var i = 0; i < els.length; i++) {
        var existing_instance = els[i]['data-froala.editor'];

        if (existing_instance) {
          console.warn('Froala Editor instance already exists.');
          inst.push(existing_instance);
        } else {
          inst.push(new FroalaEditor.Bootstrap(els[i], options, initCallback));
        }
      } // Only one element.


      if (inst.length == 1) {
        return inst[0];
      }

      return inst;
    }

    return new FroalaEditor.Bootstrap(selector, options, initCallback);
  }

  FroalaEditor.RegisterPlugins = function (plgList) {
    for (var i = 0; i < plgList.length; i++) {
      plgList[i].call(FroalaEditor);
    }
  };

  Object.assign(FroalaEditor, defaults);

  FroalaEditor.MODULES.node = function (editor) {
    var $ = editor.$;

    function getContents(node) {
      if (!node || node.tagName === 'IFRAME') {
        return [];
      }

      return Array.prototype.slice.call(node.childNodes || []);
    }
    /**
     * Determine if the node is a block tag.
     */


    function isBlock(node) {
      if (!node) {
        return false;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return false;
      }

      return FroalaEditor.BLOCK_TAGS.indexOf(node.tagName.toLowerCase()) >= 0;
    }
    /**
     * Determine if the node is a link tag.
     */


    function isLink(node) {
      if (!node) {
        return false;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return false;
      }

      return node.tagName.toLowerCase() === 'a';
    }
    /**
     * Check if a DOM element is empty.
     */


    function isEmpty(el, ignore_markers) {
      if (!el) {
        return true;
      }

      if (el.querySelector('table')) {
        return false;
      } // Get element contents.


      var contents = getContents(el); // Check if there is a block tag.

      if (contents.length === 1 && isBlock(contents[0])) {
        contents = getContents(contents[0]);
      }

      var has_br = false;

      for (var i = 0; i < contents.length; i++) {
        var node = contents[i];

        if (ignore_markers && editor.node.hasClass(node, 'fr-marker')) {
          continue;
        }

        if (node.nodeType === Node.TEXT_NODE && node.textContent.length === 0) {
          continue;
        }

        if (node.tagName !== 'BR' && (node.textContent || '').replace(/\u200B/gi, '').replace(/\n/g, '').length > 0) {
          return false;
        }

        if (has_br) {
          return false;
        } else if (node.tagName === 'BR') {
          has_br = true;
        }
      } // Look for void nodes.


      if (el.querySelectorAll(FroalaEditor.VOID_ELEMENTS.join(',')).length - el.querySelectorAll('br').length) {
        return false;
      } // Look for empty allowed tags.


      if (el.querySelector("".concat(editor.opts.htmlAllowedEmptyTags.join(':not(.fr-marker),'), ":not(.fr-marker)"))) {
        return false;
      } // Look for block tags.


      if (el.querySelectorAll(FroalaEditor.BLOCK_TAGS.join(',')).length > 1) {
        return false;
      } // Look for do not wrap tags.


      if (el.querySelector("".concat(editor.opts.htmlDoNotWrapTags.join(':not(.fr-marker),'), ":not(.fr-marker)"))) {
        return false;
      }

      return true;
    }
    /**
     * Get the block parent.
     */


    function blockParent(node) {
      while (node && node.parentNode !== editor.el && !(node.parentNode && editor.node.hasClass(node.parentNode, 'fr-inner'))) {
        node = node.parentNode;

        if (isBlock(node)) {
          return node;
        }
      }

      return null;
    }
    /**
     * Get deepest parent till the element.
     */


    function deepestParent(node, until, simple_enter) {
      if (typeof until === 'undefined') {
        until = [];
      }

      if (typeof simple_enter === 'undefined') {
        simple_enter = true;
      }

      until.push(editor.el);

      if (until.indexOf(node.parentNode) >= 0 || node.parentNode && editor.node.hasClass(node.parentNode, 'fr-inner') || node.parentNode && FroalaEditor.SIMPLE_ENTER_TAGS.indexOf(node.parentNode.tagName) >= 0 && simple_enter) {
        return null;
      } // 1. Before until.
      // 2. Parent node doesn't has class fr-inner.
      // 3. Parent node is not a simple enter tag or quote.
      // 4. Parent node is not a block tag


      while (until.indexOf(node.parentNode) < 0 && node.parentNode && !editor.node.hasClass(node.parentNode, 'fr-inner') && (FroalaEditor.SIMPLE_ENTER_TAGS.indexOf(node.parentNode.tagName) < 0 || !simple_enter) && !(isBlock(node) && !isBlock(node.parentNode)) && (!(isBlock(node) && isBlock(node.parentNode)) || !simple_enter)) {
        node = node.parentNode;
      }

      return node;
    }

    function rawAttributes(node) {
      var attrs = {};
      var atts = node.attributes;

      if (atts) {
        for (var i = 0; i < atts.length; i++) {
          var att = atts[i];
          attrs[att.nodeName] = att.value;
        }
      }

      return attrs;
    }
    /**
     * Get attributes for a node as a string.
     */


    function attributes(node) {
      var str = '';
      var atts = rawAttributes(node);
      var keys = Object.keys(atts).sort();

      for (var i = 0; i < keys.length; i++) {
        var nodeName = keys[i];
        var value = atts[nodeName]; // Double quote + no single quote. (")

        if (value.indexOf('\'') < 0 && value.indexOf('"') >= 0) {
          str += " ".concat(nodeName, "='").concat(value, "'");
        } // Double quote + single quote. ("')
        else if (value.indexOf('"') >= 0 && value.indexOf('\'') >= 0) {
            value = value.replace(/"/g, '&quot;');
            str += " ".concat(nodeName, "=\"").concat(value, "\"");
          } // Single quote or no quote at all.
          else {
              str += " ".concat(nodeName, "=\"").concat(value, "\"");
            }
      }

      return str;
    }

    function clearAttributes(node) {
      var atts = node.attributes;

      for (var i = atts.length - 1; i >= 0; i--) {
        var att = atts[i];
        node.removeAttribute(att.nodeName);
      }
    }
    /**
     * Open string for a node.
     */


    function openTagString(node) {
      return "<".concat(node.tagName.toLowerCase()).concat(attributes(node), ">");
    }
    /**
     * Close string for a node.
     */


    function closeTagString(node) {
      return "</".concat(node.tagName.toLowerCase(), ">");
    }
    /**
     * Determine if the node has any left sibling.
     */


    function isFirstSibling(node, ignore_markers) {
      if (typeof ignore_markers === 'undefined') {
        ignore_markers = true;
      }

      var sibling = node.previousSibling;

      while (sibling && ignore_markers && editor.node.hasClass(sibling, 'fr-marker')) {
        sibling = sibling.previousSibling;
      }

      if (!sibling) {
        return true;
      }

      if (sibling.nodeType === Node.TEXT_NODE && sibling.textContent === '') {
        return isFirstSibling(sibling);
      }

      return false;
    }
    /**
     * Determine if the node has any right sibling.
     */


    function isLastSibling(node, ignore_markers) {
      if (typeof ignore_markers === 'undefined') {
        ignore_markers = true;
      }

      var sibling = node.nextSibling;

      while (sibling && ignore_markers && editor.node.hasClass(sibling, 'fr-marker')) {
        sibling = sibling.nextSibling;
      }

      if (!sibling) {
        return true;
      }

      if (sibling.nodeType === Node.TEXT_NODE && sibling.textContent === '') {
        return isLastSibling(sibling);
      }

      return false;
    }

    function isVoid(node) {
      return node && node.nodeType === Node.ELEMENT_NODE && FroalaEditor.VOID_ELEMENTS.indexOf((node.tagName || '').toLowerCase()) >= 0;
    }
    /**
     * Check if the node is a list.
     */


    function isList(node) {
      if (!node) {
        return false;
      }

      return ['UL', 'OL'].indexOf(node.tagName) >= 0;
    }
    /**
     * Check if the node is the editable element.
     */


    function isElement(node) {
      return node === editor.el;
    }
    /**
     * Check if the node is the editable element.
     */


    function isDeletable(node) {
      return node && node.nodeType === Node.ELEMENT_NODE && node.getAttribute('class') && (node.getAttribute('class') || '').indexOf('fr-deletable') >= 0;
    }
    /**
     * Check if the node has focus.
     */


    function hasFocus(node) {
      return node === editor.doc.activeElement && (!editor.doc.hasFocus || editor.doc.hasFocus()) && Boolean(isElement(node) || node.type || node.href || ~node.tabIndex);
    }

    function isEditable(node) {
      return (!node.getAttribute || node.getAttribute('contenteditable') !== 'false') && ['STYLE', 'SCRIPT'].indexOf(node.tagName) < 0;
    }

    function hasClass(el, cls) {
      if (el instanceof $) {
        el = el.get(0);
      }

      return el && el.classList && el.classList.contains(cls);
    }

    function filter(callback) {
      if (editor.browser.msie) {
        return callback;
      }

      return {
        acceptNode: callback
      };
    }

    return {
      isBlock: isBlock,
      isEmpty: isEmpty,
      blockParent: blockParent,
      deepestParent: deepestParent,
      rawAttributes: rawAttributes,
      attributes: attributes,
      clearAttributes: clearAttributes,
      openTagString: openTagString,
      closeTagString: closeTagString,
      isFirstSibling: isFirstSibling,
      isLastSibling: isLastSibling,
      isList: isList,
      isLink: isLink,
      isElement: isElement,
      contents: getContents,
      isVoid: isVoid,
      hasFocus: hasFocus,
      isEditable: isEditable,
      isDeletable: isDeletable,
      hasClass: hasClass,
      filter: filter
    };
  };

  Object.assign(FroalaEditor.DEFAULTS, {
    // Tags that describe head from HEAD http://www.w3schools.com/html/html_head.asp.
    htmlAllowedTags: ['a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'menu', 'menuitem', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'pre', 'progress', 'queue', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'style', 'section', 'select', 'small', 'source', 'span', 'strike', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr'],
    htmlRemoveTags: ['script', 'style'],
    htmlAllowedAttrs: ['accept', 'accept-charset', 'accesskey', 'action', 'align', 'allowfullscreen', 'allowtransparency', 'alt', 'async', 'autocomplete', 'autofocus', 'autoplay', 'autosave', 'background', 'bgcolor', 'border', 'charset', 'cellpadding', 'cellspacing', 'checked', 'cite', 'class', 'color', 'cols', 'colspan', 'content', 'contenteditable', 'contextmenu', 'controls', 'coords', 'data', 'data-.*', 'datetime', 'default', 'defer', 'dir', 'dirname', 'disabled', 'download', 'draggable', 'dropzone', 'enctype', 'for', 'form', 'formaction', 'frameborder', 'headers', 'height', 'hidden', 'high', 'href', 'hreflang', 'http-equiv', 'icon', 'id', 'ismap', 'itemprop', 'keytype', 'kind', 'label', 'lang', 'language', 'list', 'loop', 'low', 'max', 'maxlength', 'media', 'method', 'min', 'mozallowfullscreen', 'multiple', 'muted', 'name', 'novalidate', 'open', 'optimum', 'pattern', 'ping', 'placeholder', 'playsinline', 'poster', 'preload', 'pubdate', 'radiogroup', 'readonly', 'rel', 'required', 'reversed', 'rows', 'rowspan', 'sandbox', 'scope', 'scoped', 'scrolling', 'seamless', 'selected', 'shape', 'size', 'sizes', 'span', 'src', 'srcdoc', 'srclang', 'srcset', 'start', 'step', 'summary', 'spellcheck', 'style', 'tabindex', 'target', 'title', 'type', 'translate', 'usemap', 'value', 'valign', 'webkitallowfullscreen', 'width', 'wrap'],
    htmlAllowedStyleProps: ['.*'],
    htmlAllowComments: true,
    htmlUntouched: false,
    fullPage: false // Will also turn iframe on.

  });
  FroalaEditor.HTML5Map = {
    B: 'STRONG',
    I: 'EM',
    STRIKE: 'S'
  };

  FroalaEditor.MODULES.clean = function (editor) {
    var $ = editor.$;
    var allowedTagsRE;
    var removeTagsRE;
    var allowedAttrsRE;
    var allowedStylePropsRE;

    function _removeInvisible(node) {
      if (node.nodeType === Node.ELEMENT_NODE && node.getAttribute('class') && node.getAttribute('class').indexOf('fr-marker') >= 0) {
        return false;
      } // Get node contents.


      var contents = editor.node.contents(node);
      var markers = [];
      var i; // Loop through contents.

      for (i = 0; i < contents.length; i++) {
        // If node is not void.
        if (contents[i].nodeType === Node.ELEMENT_NODE && !editor.node.isVoid(contents[i])) {
          // There are invisible spaces.
          if (contents[i].textContent.replace(/\u200b/g, '').length !== contents[i].textContent.length) {
            // Do remove invisible spaces.
            _removeInvisible(contents[i]);
          }
        } // If node is text node, replace invisible spaces.
        else if (contents[i].nodeType === Node.TEXT_NODE) {
            contents[i].textContent = contents[i].textContent.replace(/\u200b/g, ''); // .replace(/&/g, '&amp;');
          }
      } // Reasess contents after cleaning invisible spaces.


      if (node.nodeType === Node.ELEMENT_NODE && !editor.node.isVoid(node)) {
        node.normalize();
        contents = editor.node.contents(node);
        markers = node.querySelectorAll('.fr-marker'); // All we have left are markers.

        if (contents.length - markers.length === 0) {
          // Make sure contents are all markers.
          for (i = 0; i < contents.length; i++) {
            if (contents[i].nodeType === Node.ELEMENT_NODE && (contents[i].getAttribute('class') || '').indexOf('fr-marker') < 0) {
              return false;
            }
          }

          for (i = 0; i < markers.length; i++) {
            node.parentNode.insertBefore(markers[i].cloneNode(true), node);
          }

          node.parentNode.removeChild(node);
          return false;
        }
      }
    }

    function _toHTML(el, is_pre) {
      if (el.nodeType === Node.COMMENT_NODE) {
        return "<!--".concat(el.nodeValue, "-->");
      }

      if (el.nodeType === Node.TEXT_NODE) {
        if (is_pre) {
          return el.textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        return el.textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u00A0/g, '&nbsp;').replace(/\u0009/g, '');
      }

      if (el.nodeType !== Node.ELEMENT_NODE) {
        return el.outerHTML;
      }

      if (el.nodeType === Node.ELEMENT_NODE && ['STYLE', 'SCRIPT', 'NOSCRIPT'].indexOf(el.tagName) >= 0) {
        return el.outerHTML;
      }

      if (el.nodeType === Node.ELEMENT_NODE && el.tagName === 'svg') {
        var temp = document.createElement('div');
        var node_clone = el.cloneNode(true);
        temp.appendChild(node_clone);
        return temp.innerHTML;
      }

      if (el.tagName === 'IFRAME') {
        return el.outerHTML.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      }

      var contents = el.childNodes;

      if (contents.length === 0) {
        return el.outerHTML;
      }

      var str = '';

      for (var i = 0; i < contents.length; i++) {
        if (el.tagName === 'PRE') {
          is_pre = true;
        }

        str += _toHTML(contents[i], is_pre);
      }

      return editor.node.openTagString(el) + str + editor.node.closeTagString(el);
    }

    var scripts = [];

    function _encode(dirty_html) {
      // Replace script tag with comments.
      scripts = [];
      dirty_html = dirty_html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, function (str) {
        scripts.push(str);
        return "[FROALA.EDITOR.SCRIPT ".concat(scripts.length - 1, "]");
      });
      dirty_html = dirty_html.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, function (str) {
        scripts.push(str);
        return "[FROALA.EDITOR.NOSCRIPT ".concat(scripts.length - 1, "]");
      });
      dirty_html = dirty_html.replace(/<meta((?:[\w\W]*?)) http-equiv="/g, '<meta$1 data-fr-http-equiv="');
      dirty_html = dirty_html.replace(/<img((?:[\w\W]*?)) src="/g, '<img$1 data-fr-src="');
      return dirty_html;
    }

    function _decode(dirty_html) {
      // Replace script comments with the original script.
      dirty_html = dirty_html.replace(/\[FROALA\.EDITOR\.SCRIPT ([\d]*)\]/gi, function (str, a1) {
        if (editor.opts.htmlRemoveTags.indexOf('script') >= 0) {
          return '';
        }

        return scripts[parseInt(a1, 10)];
      });
      dirty_html = dirty_html.replace(/\[FROALA\.EDITOR\.NOSCRIPT ([\d]*)\]/gi, function (str, a1) {
        if (editor.opts.htmlRemoveTags.indexOf('noscript') >= 0) {
          return '';
        }

        return scripts[parseInt(a1, 10)].replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      });
      dirty_html = dirty_html.replace(/<img((?:[\w\W]*?)) data-fr-src="/g, '<img$1 src="');
      return dirty_html;
    }
    /*
     * Clean style attribute.
     */


    function _cleanStyle(style) {
      var cleaned_style = style.replace(/;;/gi, ';');
      cleaned_style = cleaned_style.replace(/^;/gi, '');

      if (cleaned_style.charAt(cleaned_style.length) !== ';') {
        cleaned_style += ';';
      }

      return cleaned_style;
    }

    function _cleanAttrs(attrs) {
      var nm;

      for (nm in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, nm)) {
          // Check if attr is allowed.
          var is_attr_allowed = nm.match(allowedAttrsRE); // Check for allowed style properties.

          var allowed_style_props_matches = null; // There are allowed style props.

          if (nm === 'style' && editor.opts.htmlAllowedStyleProps.length) {
            allowed_style_props_matches = attrs[nm].match(allowedStylePropsRE);
          } // Attribute is allowed and there are style matches.


          if (is_attr_allowed && allowed_style_props_matches) {
            // Override attr value with only the allowed properties.
            attrs[nm] = _cleanStyle(allowed_style_props_matches.join(';'));
          } else if (!is_attr_allowed || nm === 'style' && !allowed_style_props_matches) {
            delete attrs[nm];
          }
        }
      }

      var str = '';
      var keys = Object.keys(attrs).sort();

      for (var i = 0; i < keys.length; i++) {
        nm = keys[i]; // Make sure we don't break any HTML.

        if (attrs[nm].indexOf('"') < 0) {
          str += " ".concat(nm, "=\"").concat(attrs[nm], "\"");
        } else {
          str += " ".concat(nm, "='").concat(attrs[nm], "'");
        }
      }

      return str;
    }

    function _rebuild(body_html, head_html, original_html) {
      if (editor.opts.fullPage) {
        // Get DOCTYPE.
        var doctype = editor.html.extractDoctype(original_html); // Get HTML attributes.

        var html_attrs = _cleanAttrs(editor.html.extractNodeAttrs(original_html, 'html')); // Get HEAD data.


        head_html = head_html === null ? editor.html.extractNode(original_html, 'head') || '<title></title>' : head_html;

        var head_attrs = _cleanAttrs(editor.html.extractNodeAttrs(original_html, 'head')); // Get BODY attributes.


        var body_attrs = _cleanAttrs(editor.html.extractNodeAttrs(original_html, 'body'));

        return "".concat(doctype, "<html").concat(html_attrs, "><head").concat(head_attrs, ">").concat(head_html, "</head><body").concat(body_attrs, ">").concat(body_html, "</body></html>");
      }

      return body_html;
    }

    function _process(html, func) {
      var i;
      var doc = document.implementation.createHTMLDocument('Froala DOC');
      var el = doc.createElement('DIV');
      $(el).append(html);
      var new_html = '';

      if (el) {
        var els = editor.node.contents(el);

        for (i = 0; i < els.length; i++) {
          func(els[i]);
        }

        els = editor.node.contents(el);

        for (i = 0; i < els.length; i++) {
          new_html += _toHTML(els[i]);
        }
      }

      return new_html;
    }

    function exec(html, func, parse_head) {
      html = _encode(html);
      var b_html = html;
      var h_html = null;

      if (editor.opts.fullPage) {
        // Get BODY data.
        b_html = editor.html.extractNode(html, 'body') || (html.indexOf('<body') >= 0 ? '' : html);

        if (parse_head) {
          h_html = editor.html.extractNode(html, 'head') || '';
        }
      }

      b_html = _process(b_html, func);

      if (h_html) {
        h_html = _process(h_html, func);
      }

      var new_html = _rebuild(b_html, h_html, html);

      return _decode(new_html);
    }

    function invisibleSpaces(dirty_html) {
      if (dirty_html.replace(/\u200b/g, '').length === dirty_html.length) {
        return dirty_html;
      }

      return editor.clean.exec(dirty_html, _removeInvisible);
    }

    function toHTML5() {
      var els = editor.el.querySelectorAll(Object.keys(FroalaEditor.HTML5Map).join(','));

      if (els.length) {
        var sel_saved = false;

        if (!editor.el.querySelector('.fr-marker')) {
          editor.selection.save();
          sel_saved = true;
        }

        for (var i = 0; i < els.length; i++) {
          if (editor.node.attributes(els[i]) === '') {
            $(els[i]).replaceWith("<".concat(FroalaEditor.HTML5Map[els[i].tagName], ">").concat(els[i].innerHTML, "</").concat(FroalaEditor.HTML5Map[els[i].tagName], ">"));
          }
        }

        if (sel_saved) {
          editor.selection.restore();
        }
      }
    } // Fixes paths coming as HTML entities which are later on converted to their coresponding chars.


    function _convertHref(href) {
      var div = editor.doc.createElement('DIV');
      div.innerText = href;
      return div.textContent;
    }

    function _node(node) {
      // Skip when we're dealing with markers.
      if (node.tagName === 'SPAN' && (node.getAttribute('class') || '').indexOf('fr-marker') >= 0) {
        return false;
      }

      if (node.tagName === 'PRE') {
        _cleanPre(node);
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.getAttribute('data-fr-src') && node.getAttribute('data-fr-src').indexOf('blob:') !== 0) {
          node.setAttribute('data-fr-src', editor.helpers.sanitizeURL(_convertHref(node.getAttribute('data-fr-src'))));
        }

        if (node.getAttribute('href')) {
          node.setAttribute('href', editor.helpers.sanitizeURL(_convertHref(node.getAttribute('href'))));
        }

        if (node.getAttribute('src')) {
          node.setAttribute('src', editor.helpers.sanitizeURL(_convertHref(node.getAttribute('src'))));
        }

        if (['TABLE', 'TBODY', 'TFOOT', 'TR'].indexOf(node.tagName) >= 0) {
          node.innerHTML = node.innerHTML.trim();
        }
      } // Remove local images if option they are not allowed.


      if (!editor.opts.pasteAllowLocalImages && node.nodeType === Node.ELEMENT_NODE && node.tagName === 'IMG' && node.getAttribute('data-fr-src') && node.getAttribute('data-fr-src').indexOf('file://') === 0) {
        node.parentNode.removeChild(node);
        return false;
      }

      if (node.nodeType === Node.ELEMENT_NODE && FroalaEditor.HTML5Map[node.tagName] && editor.node.attributes(node) === '') {
        var tg = FroalaEditor.HTML5Map[node.tagName];
        var new_node = "<".concat(tg, ">").concat(node.innerHTML, "</").concat(tg, ">");
        node.insertAdjacentHTML('beforebegin', new_node);
        node = node.previousSibling;
        node.parentNode.removeChild(node.nextSibling);
      }

      if (!editor.opts.htmlAllowComments && node.nodeType === Node.COMMENT_NODE) {
        // Do not remove FROALA.EDITOR comments.
        if (node.data.indexOf('[FROALA.EDITOR') !== 0) {
          node.parentNode.removeChild(node);
        }
      } // Remove completely tags in denied tags.
      else if (node.tagName && node.tagName.match(removeTagsRE)) {
          node.parentNode.removeChild(node);
        } // Unwrap tags not in allowed tags.
        else if (node.tagName && !node.tagName.match(allowedTagsRE)) {
            // https://github.com/froala/wysiwyg-editor/issues/1711 . If svg is not allowed then remove it because it is a leaf node.
            if (node.tagName === 'svg') {
              node.parentNode.removeChild(node);
            } // Ignore path tag nodes that are inside a svg tag node.
            else if (!(editor.browser.safari && node.tagName === 'path' && node.parentNode && node.parentNode.tagName === 'svg')) {
                node.outerHTML = node.innerHTML;
              }
          } // Check denied attributes.
          else {
              var attrs = node.attributes;

              if (attrs) {
                for (var i = attrs.length - 1; i >= 0; i--) {
                  var attr = attrs[i]; // Check if attr is allowed.

                  var is_attr_allowed = attr.nodeName.match(allowedAttrsRE); // Check for allowed style properties.

                  var allowed_style_props_matches = null; // There are allowed style props.

                  if (attr.nodeName === 'style' && editor.opts.htmlAllowedStyleProps.length) {
                    allowed_style_props_matches = attr.value.match(allowedStylePropsRE);
                  } // Attribute is allowed and there are style matches.


                  if (is_attr_allowed && allowed_style_props_matches) {
                    // Override attr value with only the allowed properties.
                    attr.value = _cleanStyle(allowed_style_props_matches.join(';'));
                  } else if (!is_attr_allowed || attr.nodeName === 'style' && !allowed_style_props_matches) {
                    node.removeAttribute(attr.nodeName);
                  }
                }
              }
            }
    }

    function _run(node) {
      var contents = editor.node.contents(node);

      for (var i = 0; i < contents.length; i++) {
        if (contents[i].nodeType !== Node.TEXT_NODE) {
          _run(contents[i]);
        }
      }

      _node(node);
    }
    /**
     * Clean pre.
     */


    function _cleanPre(pre) {
      var content = pre.innerHTML;

      if (content.indexOf('\n') >= 0) {
        pre.innerHTML = content.replace(/\n/g, '<br>');
      }
    }
    /**
     * Clean the html input.
     */


    function html(dirty_html, denied_tags, denied_attrs, full_page) {
      if (typeof denied_tags === 'undefined') {
        denied_tags = [];
      }

      if (typeof denied_attrs === 'undefined') {
        denied_attrs = [];
      }

      if (typeof full_page === 'undefined') {
        full_page = false;
      } // Empty spaces after BR always collapse.
      // dirty_html = dirty_html.replace(/<br> */g, '<br>');
      // Build the allowed tags array.


      var allowed_tags = $.merge([], editor.opts.htmlAllowedTags);
      var i;

      for (i = 0; i < denied_tags.length; i++) {
        if (allowed_tags.indexOf(denied_tags[i]) >= 0) {
          allowed_tags.splice(allowed_tags.indexOf(denied_tags[i]), 1);
        }
      } // Build the allowed attrs array.


      var allowed_attrs = $.merge([], editor.opts.htmlAllowedAttrs);

      for (i = 0; i < denied_attrs.length; i++) {
        if (allowed_attrs.indexOf(denied_attrs[i]) >= 0) {
          allowed_attrs.splice(allowed_attrs.indexOf(denied_attrs[i]), 1);
        }
      } // We should allow data-fr.


      allowed_attrs.push('data-fr-.*');
      allowed_attrs.push('fr-.*'); // Generate cleaning RegEx.

      allowedTagsRE = new RegExp("^".concat(allowed_tags.join('$|^'), "$"), 'gi');
      allowedAttrsRE = new RegExp("^".concat(allowed_attrs.join('$|^'), "$"), 'gi');
      removeTagsRE = new RegExp("^".concat(editor.opts.htmlRemoveTags.join('$|^'), "$"), 'gi');

      if (editor.opts.htmlAllowedStyleProps.length) {
        allowedStylePropsRE = new RegExp("((^|;|\\s)".concat(editor.opts.htmlAllowedStyleProps.join(':.+?(?=;|$))|((^|;|\\s)'), ":.+?(?=(;)|$))"), 'gi');
      } else {
        allowedStylePropsRE = null;
      }

      dirty_html = exec(dirty_html, _run, true);
      return dirty_html;
    }

    function _tablesWrapTHEAD() {
      var trs = editor.el.querySelectorAll('tr'); // Make sure the TH lives inside thead.

      for (var i = 0; i < trs.length; i++) {
        // Search for th inside tr.
        var children = trs[i].children;
        var ok = true;

        for (var j = 0; j < children.length; j++) {
          if (children[j].tagName !== 'TH') {
            ok = false;
            break;
          }
        } // If there is something else than TH.


        if (ok === false || children.length === 0) {
          continue;
        }

        var tr = trs[i];

        while (tr && tr.tagName !== 'TABLE' && tr.tagName !== 'THEAD') {
          tr = tr.parentNode;
        }

        var thead = tr;

        if (thead.tagName !== 'THEAD') {
          thead = editor.doc.createElement('THEAD');
          tr.insertBefore(thead, tr.firstChild);
        }

        thead.appendChild(trs[i]);
      }
    }
    /**
     * Clean tables.
     */


    function tables() {
      _tablesWrapTHEAD();
    }

    function _listsWrapMissplacedLI() {
      // Find missplaced list items.
      var lis = [];

      function filterListItem(li) {
        return !editor.node.isList(li.parentNode);
      }

      do {
        if (lis.length) {
          var li = lis[0];
          var ul = editor.doc.createElement('ul');
          li.parentNode.insertBefore(ul, li);

          do {
            var tmp = li;
            li = li.nextSibling;
            ul.appendChild(tmp);
          } while (li && li.tagName === 'LI');
        }

        lis = [];
        var li_sel = editor.el.querySelectorAll('li');

        for (var i = 0; i < li_sel.length; i++) {
          if (filterListItem(li_sel[i])) {
            lis.push(li_sel[i]);
          }
        }
      } while (lis.length > 0);
    }

    function _listsJoinSiblings() {
      // Join lists.
      var sibling_lists = editor.el.querySelectorAll('ol + ol, ul + ul');

      for (var k = 0; k < sibling_lists.length; k++) {
        var list = sibling_lists[k];

        if (editor.node.isList(list.previousSibling) && editor.node.openTagString(list) === editor.node.openTagString(list.previousSibling)) {
          var childs = editor.node.contents(list);

          for (var i = 0; i < childs.length; i++) {
            list.previousSibling.appendChild(childs[i]);
          }

          list.parentNode.removeChild(list);
        }
      }
    }

    function _listsRemoveEmpty() {
      var i; // Remove empty lists.

      var do_remove;

      function removeEmptyList(lst) {
        if (!lst.querySelector('LI')) {
          do_remove = true;
          lst.parentNode.removeChild(lst);
        }
      }

      do {
        do_remove = false; // Remove empty li.

        var empty_lis = editor.el.querySelectorAll('li:empty');

        for (i = 0; i < empty_lis.length; i++) {
          empty_lis[i].parentNode.removeChild(empty_lis[i]);
        } // Remove empty ul and ol.


        var remaining_lists = editor.el.querySelectorAll('ul, ol');

        for (i = 0; i < remaining_lists.length; i++) {
          removeEmptyList(remaining_lists[i]);
        }
      } while (do_remove === true);
    }

    function _listsWrapLists() {
      // Do not allow list directly inside another list.
      var direct_lists = editor.el.querySelectorAll('ul > ul, ol > ol, ul > ol, ol > ul');

      for (var i = 0; i < direct_lists.length; i++) {
        var list = direct_lists[i];
        var prev_li = list.previousSibling;

        if (prev_li) {
          if (prev_li.tagName === 'LI') {
            prev_li.appendChild(list);
          } else {
            $(list).wrap('<li></li>');
          }
        }
      }
    }

    function _listsNoTagAfterNested() {
      // Check if nested lists don't have HTML after them.
      var nested_lists = editor.el.querySelectorAll('li > ul, li > ol');

      for (var i = 0; i < nested_lists.length; i++) {
        var lst = nested_lists[i];

        if (lst.nextSibling) {
          var node = lst.nextSibling;
          var $new_li = $(editor.doc.createElement('LI'));
          $(lst.parentNode).after($new_li.get(0));

          do {
            var tmp = node;
            node = node.nextSibling;
            $new_li.append(tmp);
          } while (node);
        }
      }
    }

    function _listsTypeInNested() {
      // Make sure we can type in nested list.
      var nested_lists = editor.el.querySelectorAll('li > ul, li > ol');

      for (var i = 0; i < nested_lists.length; i++) {
        var lst = nested_lists[i]; // List is the first in the LI.

        if (editor.node.isFirstSibling(lst)) {
          $(lst).before('<br/>');
        } // Make sure we don't leave BR before list.
        else if (lst.previousSibling && lst.previousSibling.tagName === 'BR') {
            var prev_node = lst.previousSibling.previousSibling; // Skip markers.

            while (prev_node && editor.node.hasClass(prev_node, 'fr-marker')) {
              prev_node = prev_node.previousSibling;
            } // Remove BR only if there is something else than BR.


            if (prev_node && prev_node.tagName !== 'BR') {
              $(lst.previousSibling).remove();
            }
          }
      }
    }

    function _listsRemoveEmptyLI() {
      // Remove empty li.
      var empty_lis = editor.el.querySelectorAll('li:empty');

      for (var i = 0; i < empty_lis.length; i++) {
        $(empty_lis[i]).remove();
      }
    }

    function _listsFindMissplacedText() {
      var lists = editor.el.querySelectorAll('ul, ol');

      for (var i = 0; i < lists.length; i++) {
        var contents = editor.node.contents(lists[i]);
        var $li = null;

        for (var j = contents.length - 1; j >= 0; j--) {
          // https://github.com/froala/wysiwyg-editor/issues/3033
          if (contents[j].tagName !== 'LI' && contents[j].tagName != 'UL' && contents[j].tagName != 'OL') {
            if (!$li) {
              $li = $(editor.doc.createElement('LI'));
              $li.insertBefore(contents[j]);
            }

            $li.prepend(contents[j]);
          } else {
            $li = null;
          }
        }
      }
    }
    /**
     * Clean lists.
     */


    function lists() {
      _listsWrapMissplacedLI();

      _listsJoinSiblings();

      _listsFindMissplacedText();

      _listsRemoveEmpty();

      _listsWrapLists();

      _listsNoTagAfterNested();

      _listsTypeInNested();

      _listsRemoveEmptyLI();
    }
    /**
     * Initialize
     */


    function _init() {
      // If fullPage is on allow head and title.
      if (editor.opts.fullPage) {
        $.merge(editor.opts.htmlAllowedTags, ['head', 'title', 'style', 'link', 'base', 'body', 'html', 'meta']);
      }
    }

    return {
      _init: _init,
      html: html,
      toHTML5: toHTML5,
      tables: tables,
      lists: lists,
      invisibleSpaces: invisibleSpaces,
      exec: exec
    };
  };

  FroalaEditor.XS = 0;
  FroalaEditor.SM = 1;
  FroalaEditor.MD = 2;
  FroalaEditor.LG = 3; // Chars to allow.

  var x = "a-z\\u0080-\\u009f\\u00a1-\\uffff0-9-_\\."; // Common regex to avoid double chars.

  FroalaEditor.LinkRegExCommon = "[".concat(x, "]{1,}"); // PORT:something_else.php

  FroalaEditor.LinkRegExEnd = "((:[0-9]{1,5})|)(((\\/|\\?|#)[a-z\\u00a1-\\uffff0-9@?\\|!^=%&amp;\\/~+#-\\'*-_{}]*)|())"; // Common TLD

  FroalaEditor.LinkRegExTLD = "((".concat(FroalaEditor.LinkRegExCommon, ")(\\.(com|net|org|edu|mil|gov|co|biz|info|me|dev)))"); // Starts with HTTP.

  FroalaEditor.LinkRegExHTTP = "((ftp|http|https):\\/\\/".concat(FroalaEditor.LinkRegExCommon, ")"); // Authenticate with HTTP.

  FroalaEditor.LinkRegExAuth = "((ftp|http|https):\\/\\/[\\u0021-\\uffff]{1,}@".concat(FroalaEditor.LinkRegExCommon, ")"); // Starts with WWWW.

  FroalaEditor.LinkRegExWWW = "(www\\.".concat(FroalaEditor.LinkRegExCommon, "\\.[a-z0-9-]{2,24})"); // Join.

  FroalaEditor.LinkRegEx = "(".concat(FroalaEditor.LinkRegExTLD, "|").concat(FroalaEditor.LinkRegExHTTP, "|").concat(FroalaEditor.LinkRegExWWW, "|").concat(FroalaEditor.LinkRegExAuth, ")").concat(FroalaEditor.LinkRegExEnd); // Link protocols.

  FroalaEditor.LinkProtocols = ['mailto', 'tel', 'sms', 'notes', 'data']; // https://davidcel.is/posts/stop-validating-email-addresses-with-regex/

  FroalaEditor.MAIL_REGEX = /.+@.+\..+/i;

  FroalaEditor.MODULES.helpers = function (editor) {
    var $ = editor.$;
    /**
     * Get the IE version.
     */

    function _ieVersion() {
      /* global navigator */
      var rv = -1;
      var ua;
      var re;

      if (navigator.appName === 'Microsoft Internet Explorer') {
        ua = navigator.userAgent;
        re = new RegExp('MSIE ([0-9]{1,}[\\.0-9]{0,})');

        if (re.exec(ua) !== null) {
          rv = parseFloat(RegExp.$1);
        }
      } else if (navigator.appName === 'Netscape') {
        ua = navigator.userAgent;
        re = new RegExp('Trident/.*rv:([0-9]{1,}[\\.0-9]{0,})');

        if (re.exec(ua) !== null) {
          rv = parseFloat(RegExp.$1);
        }
      }

      return rv;
    }
    /**
     * Determine the browser.
     */


    function _browser() {
      var browser = {};

      var ie_version = _ieVersion();

      if (ie_version > 0) {
        browser.msie = true;
      } else {
        var ua = navigator.userAgent.toLowerCase();
        var match = /(edge)[ /]([\w.]+)/.exec(ua) || /(chrome)[ /]([\w.]+)/.exec(ua) || /(webkit)[ /]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ /]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];
        var matched = {
          browser: match[1] || '',
          version: match[2] || '0'
        };

        if (match[1]) {
          browser[matched.browser] = true;
        } // Chrome is Webkit, but Webkit is also Safari.


        if (browser.chrome) {
          browser.webkit = true;
        } else if (browser.webkit) {
          browser.safari = true;
        }
      }

      if (browser.msie) {
        browser.version = ie_version;
      }

      return browser;
    }

    function isIOS() {
      return /(iPad|iPhone|iPod)/g.test(navigator.userAgent) && !isWindowsPhone();
    }

    function isAndroid() {
      return /(Android)/g.test(navigator.userAgent) && !isWindowsPhone();
    }

    function isBlackberry() {
      return /(Blackberry)/g.test(navigator.userAgent);
    }

    function isWindowsPhone() {
      return /(Windows Phone)/gi.test(navigator.userAgent);
    }

    function isMobile() {
      return isAndroid() || isIOS() || isBlackberry();
    }

    function requestAnimationFrame() {
      return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60);
      };
    }

    function getPX(val) {
      return parseInt(val, 10) || 0;
    }

    function screenSize() {
      var $test = $(editor.doc.createElement('DIV'));
      $test.addClass('fr-visibility-helper');
      $('body').first().append($test);

      try {
        var size = getPX($test.css('margin-left'));
        $test.remove();
        return size;
      } catch (ex) {
        return FroalaEditor.LG;
      }
    }

    function isTouch() {
      return 'ontouchstart' in window || window.DocumentTouch && document instanceof window.DocumentTouch;
    }

    function isURL(url) {
      // Check if it starts with http.
      if (!/^(https?:|ftps?:|)\/\//i.test(url)) {
        return false;
      }

      url = String(url).replace(/</g, '%3C').replace(/>/g, '%3E').replace(/"/g, '%22').replace(/ /g, '%20');
      var test_reg = new RegExp("^".concat(FroalaEditor.LinkRegExHTTP).concat(FroalaEditor.LinkRegExEnd, "$"), 'gi');
      return test_reg.test(url);
    }

    function isEmail(url) {
      if (/^(https?:|ftps?:|)\/\//i.test(url)) {
        return false;
      }

      return FroalaEditor.MAIL_REGEX.test(url);
    } // Sanitize URL.


    function sanitizeURL(url) {
      var local_path = /^([A-Za-z]:(\\){1,2}|[A-Za-z]:((\\){1,2}[^\\]+)+)(\\)?$/i;

      if (/^(https?:|ftps?:|)\/\//i.test(url)) {
        return url;
      } else if (local_path.test(url)) {
        return url;
      } else if (new RegExp("^(".concat(FroalaEditor.LinkProtocols.join('|'), "):\\/\\/"), 'i').test(url)) {
        return url;
      }

      url = encodeURIComponent(url).replace(/%23/g, '#').replace(/%2F/g, '/').replace(/%25/g, '%').replace(/mailto%3A/gi, 'mailto:').replace(/file%3A/gi, 'file:').replace(/sms%3A/gi, 'sms:').replace(/tel%3A/gi, 'tel:').replace(/notes%3A/gi, 'notes:').replace(/data%3Aimage/gi, 'data:image').replace(/blob%3A/gi, 'blob:').replace(/%3A(\d)/gi, ':$1').replace(/webkit-fake-url%3A/gi, 'webkit-fake-url:').replace(/%3F/g, '?').replace(/%3D/g, '=').replace(/%26/g, '&').replace(/&amp;/g, '&').replace(/%2C/g, ',').replace(/%3B/g, ';').replace(/%2B/g, '+').replace(/%40/g, '@').replace(/%5B/g, '[').replace(/%5D/g, ']').replace(/%7B/g, '{').replace(/%7D/g, '}');
      return url;
    }

    function isArray(obj) {
      return obj && !Object.prototype.propertyIsEnumerable.call(obj, 'length') && _typeof(obj) === 'object' && typeof obj.length === 'number';
    }
    /*
     * Transform RGB color to hex value.
     */


    function RGBToHex(rgb) {
      function hex(x) {
        return "0".concat(parseInt(x, 10).toString(16)).slice(-2);
      }

      try {
        if (!rgb || rgb === 'transparent') {
          return '';
        }

        if (/^#[0-9A-F]{6}$/i.test(rgb)) {
          return rgb;
        }

        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        return "#".concat(hex(rgb[1])).concat(hex(rgb[2])).concat(hex(rgb[3])).toUpperCase();
      } catch (ex) {
        return null;
      }
    }

    function HEXtoRGB(hex) {
      // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
      var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
      });
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? "rgb(".concat(parseInt(result[1], 16), ", ").concat(parseInt(result[2], 16), ", ").concat(parseInt(result[3], 16), ")") : '';
    }
    /*
     * Get block alignment.
     */


    var default_alignment;

    function getAlignment($block) {
      if (!$block.css) {
        $block = $($block);
      }

      var alignment = ($block.css('text-align') || '').replace(/-(.*)-/g, ''); // Detect rtl.

      if (['left', 'right', 'justify', 'center'].indexOf(alignment) < 0) {
        if (!default_alignment) {
          var $div = $("<div dir=\"".concat(editor.opts.direction === 'rtl' ? 'rtl' : 'auto', "\" style=\"text-align: ").concat(editor.$el.css('text-align'), "; position: fixed; left: -3000px;\"><span id=\"s1\">.</span><span id=\"s2\">.</span></div>"));
          $('body').first().append($div);
          var l1 = $div.find('#s1').get(0).getBoundingClientRect().left;
          var l2 = $div.find('#s2').get(0).getBoundingClientRect().left;
          $div.remove();
          default_alignment = l1 < l2 ? 'left' : 'right';
        }

        alignment = default_alignment;
      }

      return alignment;
    }
    /**
     * Check if is mac.
     */


    var is_mac = null;

    function isMac() {
      if (is_mac === null) {
        is_mac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      }

      return is_mac;
    }

    function scrollTop() {
      // Firefox, Chrome, Opera, Safari
      if (editor.o_win.pageYOffset) {
        return editor.o_win.pageYOffset;
      } // Internet Explorer 6 - standards mode


      if (editor.o_doc.documentElement && editor.o_doc.documentElement.scrollTop) {
        return editor.o_doc.documentElement.scrollTop;
      } // Internet Explorer 6, 7 and 8


      if (editor.o_doc.body.scrollTop) {
        return editor.o_doc.body.scrollTop;
      }

      return 0;
    }

    function scrollLeft() {
      // Firefox, Chrome, Opera, Safari
      if (editor.o_win.pageXOffset) {
        return editor.o_win.pageXOffset;
      } // Internet Explorer 6 - standards mode


      if (editor.o_doc.documentElement && editor.o_doc.documentElement.scrollLeft) {
        return editor.o_doc.documentElement.scrollLeft;
      } // Internet Explorer 6, 7 and 8


      if (editor.o_doc.body.scrollLeft) {
        return editor.o_doc.body.scrollLeft;
      }

      return 0;
    } // https://stackoverflow.com/a/7557433/1806855


    function isInViewPort(el) {
      var rect = el.getBoundingClientRect(); // Round for FF.

      rect = {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom)
      };
      return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) || // Top is higher than 0 and bottom is smaller than the window height.
      rect.top <= 0 && rect.bottom >= (window.innerHeight || document.documentElement.clientHeight) // Top is smaller than 0 and bottom is higher than window height.
      ;
    }
    /**
     * Tear up.
     */


    function _init() {
      editor.browser = _browser();
    }

    return {
      _init: _init,
      isIOS: isIOS,
      isMac: isMac,
      isAndroid: isAndroid,
      isBlackberry: isBlackberry,
      isWindowsPhone: isWindowsPhone,
      isMobile: isMobile,
      isEmail: isEmail,
      requestAnimationFrame: requestAnimationFrame,
      getPX: getPX,
      screenSize: screenSize,
      isTouch: isTouch,
      sanitizeURL: sanitizeURL,
      isArray: isArray,
      RGBToHex: RGBToHex,
      HEXtoRGB: HEXtoRGB,
      isURL: isURL,
      getAlignment: getAlignment,
      scrollTop: scrollTop,
      scrollLeft: scrollLeft,
      isInViewPort: isInViewPort
    };
  };

  FroalaEditor.MODULES.events = function (editor) {
    var $ = editor.$;
    var _events = {};

    var _do_blur;

    function _assignEvent($el, evs, handler) {
      $on($el, evs, handler);
    }

    function _forPaste() {
      _assignEvent(editor.$el, 'cut copy paste beforepaste', function (e) {
        trigger(e.type, [e]);
      });
    }

    function _forElement() {
      _assignEvent(editor.$el, 'click mouseup mousedown touchstart touchend dragenter dragover dragleave dragend drop dragstart', function (e) {
        trigger(e.type, [e]);
      });

      on('mousedown', function () {
        for (var i = 0; i < FroalaEditor.INSTANCES.length; i++) {
          if (FroalaEditor.INSTANCES[i] !== editor && FroalaEditor.INSTANCES[i].popups && FroalaEditor.INSTANCES[i].popups.areVisible()) {
            FroalaEditor.INSTANCES[i].$el.find('.fr-marker').remove();
          }
        }
      });
    }

    function _forKeys() {
      // Map events.
      _assignEvent(editor.$el, 'keydown keypress keyup input', function (e) {
        trigger(e.type, [e]);
      });
    }

    function _forWindow() {
      _assignEvent(editor.$win, editor._mousedown, function (e) {
        trigger('window.mousedown', [e]);
        enableBlur();
      });

      _assignEvent(editor.$win, editor._mouseup, function (e) {
        trigger('window.mouseup', [e]);
      });

      _assignEvent(editor.$win, 'cut copy keydown keyup touchmove touchend', function (e) {
        trigger("window.".concat(e.type), [e]);
      });
    }

    function _forDocument() {
      _assignEvent(editor.$doc, 'dragend drop', function (e) {
        trigger("document.".concat(e.type), [e]);
      });
    }

    function focus(do_focus) {
      var info;

      if (typeof do_focus === 'undefined') {
        do_focus = true;
      }

      if (!editor.$wp) {
        return false;
      } // Focus the editor window.


      if (editor.helpers.isIOS()) {
        editor.$win.get(0).focus();
      } // If there is focus, stop.


      if (editor.core.hasFocus()) {
        return false;
      } // If there is no focus, then force focus.


      if (!editor.core.hasFocus() && do_focus) {
        var st = editor.$win.scrollTop(); // Hack to prevent scrolling IE.

        if (editor.browser.msie && editor.$box) {
          editor.$box.css('position', 'fixed');
        } // hack to prevent scrolling.


        if (editor.browser.msie && editor.$wp) {
          editor.$wp.css('overflow', 'visible');
        }

        if (editor.browser.msie && editor.$sc) editor.$sc.css('position', 'fixed');
        disableBlur();
        editor.el.focus();
        editor.events.trigger('focus');
        enableBlur(); // Revert position IE.

        if (editor.browser.msie && editor.$sc) editor.$sc.css('position', ''); // Revert position.

        if (editor.browser.msie && editor.$box) {
          editor.$box.css('position', '');
        } // Revert scroll.


        if (editor.browser.msie && editor.$wp) {
          editor.$wp.css('overflow', 'auto');
        }

        if (st !== editor.$win.scrollTop()) {
          editor.$win.scrollTop(st);
        }

        info = editor.selection.info(editor.el); // If selection is at start, we should make sure we're in the first block tag.

        if (!info.atStart) {
          return false;
        }
      } // Don't go further if we haven't focused or there are markers.


      if (!editor.core.hasFocus() || editor.$el.find('.fr-marker').length > 0) {
        return false;
      }

      info = editor.selection.info(editor.el);

      if (info.atStart && editor.selection.isCollapsed()) {
        if (editor.html.defaultTag() !== null) {
          var marker = editor.markers.insert();

          if (marker && !editor.node.blockParent(marker)) {
            $(marker).remove();
            var element = editor.$el.find(editor.html.blockTagsQuery()).get(0);

            if (element) {
              $(element).prepend(FroalaEditor.MARKERS);
              editor.selection.restore();
            }
          } else if (marker) {
            $(marker).remove();
          }
        }
      }
    }

    var focused = false;

    function _forFocus() {
      _assignEvent(editor.$el, 'focus', function (e) {
        if (blurActive()) {
          focus(false);

          if (focused === false) {
            trigger(e.type, [e]);
          }
        }
      });

      _assignEvent(editor.$el, 'blur', function (e) {
        if (blurActive()
        /* && document.activeElement !== this */
        ) {
            if (focused === true) {
              trigger(e.type, [e]);
              enableBlur();
            }
          }
      }); // Prevent blur when clicking contenteditable.


      $on(editor.$el, 'mousedown', '[contenteditable="true"]', function () {
        disableBlur();
        editor.$el.blur();
      });
      on('focus', function () {
        focused = true;
      });
      on('blur', function () {
        focused = false;
      });
    }

    function _forMouse() {
      if (editor.helpers.isMobile()) {
        editor._mousedown = 'touchstart';
        editor._mouseup = 'touchend';
        editor._move = 'touchmove';
        editor._mousemove = 'touchmove';
      } else {
        editor._mousedown = 'mousedown';
        editor._mouseup = 'mouseup';
        editor._move = '';
        editor._mousemove = 'mousemove';
      }
    }

    function _buttonMouseDown(e) {
      var $btn = $(e.currentTarget);

      if (editor.edit.isDisabled() || editor.node.hasClass($btn.get(0), 'fr-disabled')) {
        e.preventDefault();
        return false;
      } // Not click button.


      if (e.type === 'mousedown' && e.which !== 1) {
        return true;
      } // Scroll in list.


      if (!editor.helpers.isMobile()) {
        e.preventDefault();
      }

      if ((editor.helpers.isAndroid() || editor.helpers.isWindowsPhone()) && $btn.parents('.fr-dropdown-menu').length === 0) {
        e.preventDefault();
        e.stopPropagation();
      } // Simulate click.


      $btn.addClass('fr-selected');
      editor.events.trigger('commands.mousedown', [$btn]);
    }

    function _buttonMouseUp(e, handler) {
      var $btn = $(e.currentTarget);

      if (editor.edit.isDisabled() || editor.node.hasClass($btn.get(0), 'fr-disabled')) {
        e.preventDefault();
        return false;
      }

      if (e.type === 'mouseup' && e.which !== 1) {
        return true;
      } // https://github.com/froala-labs/froala-editor-js-2/issues/1877
      // when you click the button and drag to the other button, current target would be different than clicked button


      if (editor.button.getButtons('.fr-selected', true).get(0) == $btn.get(0) && !editor.node.hasClass($btn.get(0), 'fr-selected')) {
        return true;
      }

      if (e.type !== 'touchmove') {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault(); // Simulate click.

        if (!editor.node.hasClass($btn.get(0), 'fr-selected')) {
          editor.button.getButtons('.fr-selected', true).removeClass('fr-selected');
          return false;
        }

        editor.button.getButtons('.fr-selected', true).removeClass('fr-selected');

        if ($btn.data('dragging') || $btn.attr('disabled')) {
          $btn.removeData('dragging');
          return false;
        }

        var timeout = $btn.data('timeout');

        if (timeout) {
          clearTimeout(timeout);
          $btn.removeData('timeout');
        }

        handler.apply(editor, [e]);
      } else if (!$btn.data('timeout')) {
        $btn.data('timeout', setTimeout(function () {
          $btn.data('dragging', true);
        }, 100));
      }
    }

    function enableBlur() {
      _do_blur = true;
    }

    function disableBlur() {
      _do_blur = false;
    }

    function blurActive() {
      return _do_blur;
    }
    /**
     * Bind click on an element.
     */


    function bindClick($element, selector, handler) {
      $on($element, editor._mousedown, selector, function (e) {
        if (!editor.edit.isDisabled()) {
          _buttonMouseDown(e);
        }
      }, true);
      $on($element, "".concat(editor._mouseup, " ").concat(editor._move), selector, function (e) {
        if (!editor.edit.isDisabled()) {
          _buttonMouseUp(e, handler);
        }
      }, true);
      $on($element, 'mousedown click mouseup', selector, function (e) {
        if (!editor.edit.isDisabled()) {
          e.stopPropagation();
        }
      }, true);
      on('window.mouseup', function () {
        if (!editor.edit.isDisabled()) {
          $element.find(selector).removeClass('fr-selected');
          enableBlur();
        }
      });
      $on($element, 'mouseover', selector, function () {
        if ($(this).hasClass('fr-options')) {
          $(this).prev('.fr-btn').addClass('fr-btn-hover');
        }

        if ($(this).next('.fr-btn').hasClass('fr-options')) {
          $(this).next('.fr-btn').addClass('fr-btn-hover');
        }
      });
      $on($element, 'mouseout', selector, function () {
        if ($(this).hasClass('fr-options')) {
          $(this).prev('.fr-btn').removeClass('fr-btn-hover');
        }

        if ($(this).next('.fr-btn').hasClass('fr-options')) {
          $(this).next('.fr-btn').removeClass('fr-btn-hover');
        }
      });
    }
    /**
     * Add event.
     */


    function on(name, callback, first) {
      var names = name.split(' ');

      if (names.length > 1) {
        for (var i = 0; i < names.length; i++) {
          on(names[i], callback, first);
        }

        return true;
      }

      if (typeof first === 'undefined') {
        first = false;
      }

      var callbacks;

      if (name.indexOf('shared.') !== 0) {
        _events[name] = _events[name] || [];
        callbacks = _events[name];
      } else {
        editor.shared._events[name] = editor.shared._events[name] || [];
        callbacks = editor.shared._events[name];
      }

      if (first) {
        callbacks.unshift(callback);
      } else {
        callbacks.push(callback);
      }
    }

    var $_events = [];

    function $on($el, evs, selector, callback, shared) {
      if (typeof selector === 'function') {
        shared = callback;
        callback = selector;
        selector = false;
      }

      var ary = !shared ? $_events : editor.shared.$_events;
      var id = !shared ? editor.id : editor.sid;
      var eventName = "".concat(evs.trim().split(' ').join(".ed".concat(id, " ")), ".ed").concat(id);

      if (!selector) {
        $el.on(eventName, callback);
      } else {
        $el.on(eventName, selector, callback);
      }

      ary.push([$el, eventName]);
    }

    function _$off(evs) {
      for (var i = 0; i < evs.length; i++) {
        evs[i][0].off(evs[i][1]);
      }
    }

    function $off() {
      _$off($_events);

      $_events = [];

      if (editor.shared.count === 0) {
        _$off(editor.shared.$_events);

        editor.shared.$_events = [];
      }
    }
    /**
     * Trigger an event.
     */


    function trigger(name, args, force) {
      if (!editor.edit.isDisabled() || force) {
        var callbacks;

        if (name.indexOf('shared.') !== 0) {
          callbacks = _events[name];
        } else {
          if (editor.shared.count > 0) {
            return false;
          }

          callbacks = editor.shared._events[name];
        }

        var val;

        if (callbacks) {
          for (var i = 0; i < callbacks.length; i++) {
            val = callbacks[i].apply(editor, args);

            if (val === false) {
              return false;
            }
          }
        }

        if (editor.opts.events && editor.opts.events[name]) {
          val = editor.opts.events[name].apply(editor, args);

          if (val === false) {
            return false;
          }
        }

        return val;
      }
    }

    function chainTrigger(name, param, force) {
      if (!editor.edit.isDisabled() || force) {
        var callbacks;

        if (name.indexOf('shared.') !== 0) {
          callbacks = _events[name];
        } else {
          if (editor.shared.count > 0) {
            return false;
          }

          callbacks = editor.shared._events[name];
        }

        var resp;

        if (callbacks) {
          for (var i = 0; i < callbacks.length; i++) {
            // Get the callback response.
            resp = callbacks[i].apply(editor, [param]); // If callback response is defined then assign it to param.

            if (typeof resp !== 'undefined') {
              param = resp;
            }
          }
        }

        if (editor.opts.events && editor.opts.events[name]) {
          resp = editor.opts.events[name].apply(editor, [param]);

          if (typeof resp !== 'undefined') {
            param = resp;
          }
        }

        return param;
      }
    }
    /**
     * Destroy
     */


    function _destroy() {
      // Clear the events list.
      for (var k in _events) {
        if (Object.prototype.hasOwnProperty.call(_events, k)) {
          delete _events[k];
        }
      }
    }

    function _sharedDestroy() {
      for (var k in editor.shared._events) {
        if (Object.prototype.hasOwnProperty.call(editor.shared._events, k)) {
          delete editor.shared._events[k];
        }
      }
    }
    /**
     * Tear up.
     */


    function _init() {
      editor.shared.$_events = editor.shared.$_events || [];
      editor.shared._events = {};

      _forMouse();

      _forElement();

      _forWindow();

      _forDocument();

      _forKeys();

      _forFocus();

      enableBlur();

      _forPaste();

      on('destroy', _destroy);
      on('shared.destroy', _sharedDestroy);
    }

    return {
      _init: _init,
      on: on,
      trigger: trigger,
      bindClick: bindClick,
      disableBlur: disableBlur,
      enableBlur: enableBlur,
      blurActive: blurActive,
      focus: focus,
      chainTrigger: chainTrigger,
      $on: $on,
      $off: $off
    };
  };

  Object.assign(FroalaEditor.DEFAULTS, {
    indentMargin: 20
  });
  FroalaEditor.COMMANDS = {
    bold: {
      title: 'Bold',
      toggle: true,
      refresh: function refresh($btn) {
        var format = this.format.is('strong');
        $btn.toggleClass('fr-active', format).attr('aria-pressed', format);
      }
    },
    italic: {
      title: 'Italic',
      toggle: true,
      refresh: function refresh($btn) {
        var format = this.format.is('em');
        $btn.toggleClass('fr-active', format).attr('aria-pressed', format);
      }
    },
    underline: {
      title: 'Underline',
      toggle: true,
      refresh: function refresh($btn) {
        var format = this.format.is('u');
        $btn.toggleClass('fr-active', format).attr('aria-pressed', format);
      }
    },
    strikeThrough: {
      title: 'Strikethrough',
      toggle: true,
      refresh: function refresh($btn) {
        var format = this.format.is('s');
        $btn.toggleClass('fr-active', format).attr('aria-pressed', format);
      }
    },
    subscript: {
      title: 'Subscript',
      toggle: true,
      refresh: function refresh($btn) {
        var format = this.format.is('sub');
        $btn.toggleClass('fr-active', format).attr('aria-pressed', format);
      }
    },
    superscript: {
      title: 'Superscript',
      toggle: true,
      refresh: function refresh($btn) {
        var format = this.format.is('sup');
        $btn.toggleClass('fr-active', format).attr('aria-pressed', format);
      }
    },
    outdent: {
      title: 'Decrease Indent'
    },
    indent: {
      title: 'Increase Indent'
    },
    undo: {
      title: 'Undo',
      undo: false,
      forcedRefresh: true,
      disabled: true
    },
    redo: {
      title: 'Redo',
      undo: false,
      forcedRefresh: true,
      disabled: true
    },
    insertHR: {
      title: 'Insert Horizontal Line'
    },
    clearFormatting: {
      title: 'Clear Formatting'
    },
    selectAll: {
      title: 'Select All',
      undo: false
    },
    moreText: {
      title: 'More Text',
      undo: false
    },
    moreParagraph: {
      title: 'More Paragraph',
      undo: false
    },
    moreRich: {
      title: 'More Rich',
      undo: false
    },
    moreMisc: {
      title: 'More Misc',
      undo: false
    }
  };

  FroalaEditor.RegisterCommand = function (name, info) {
    FroalaEditor.COMMANDS[name] = info;
  };

  FroalaEditor.MODULES.commands = function (editor) {
    var $ = editor.$;

    function _createDefaultTag(empty) {
      if (editor.html.defaultTag()) {
        empty = "<".concat(editor.html.defaultTag(), ">").concat(empty, "</").concat(editor.html.defaultTag(), ">");
      }

      return empty;
    }

    var mapping = {
      bold: function bold() {
        _execCommand('bold', 'strong');
      },
      subscript: function subscript() {
        // Remove sup.
        if (editor.format.is('sup')) {
          editor.format.remove('sup');
        }

        _execCommand('subscript', 'sub');
      },
      superscript: function superscript() {
        // Remove sub.
        if (editor.format.is('sub')) {
          editor.format.remove('sub');
        }

        _execCommand('superscript', 'sup');
      },
      italic: function italic() {
        _execCommand('italic', 'em');
      },
      strikeThrough: function strikeThrough() {
        _execCommand('strikeThrough', 's');
      },
      underline: function underline() {
        _execCommand('underline', 'u');
      },
      undo: function undo() {
        editor.undo.run();
      },
      redo: function redo() {
        editor.undo.redo();
      },
      indent: function indent() {
        _processIndent(1);
      },
      outdent: function outdent() {
        _processIndent(-1);
      },
      show: function show() {
        if (editor.opts.toolbarInline) {
          editor.toolbar.showInline(null, true);
        }
      },
      insertHR: function insertHR() {
        editor.selection.remove();
        var empty = '';

        if (editor.core.isEmpty()) {
          empty = '<br>';
          empty = _createDefaultTag(empty);
        }

        editor.html.insert("<hr id=\"fr-just\" class=\"fr-just\">".concat(empty));
        var $hr = editor.$el.find('hr#fr-just').length ? editor.$el.find('hr#fr-just') : editor.$el.find('.fr-just');
        $hr.removeAttr('id');
        $hr.removeAttr('class');
        var check; // Make sure we can type after HR.

        if ($hr.next().length === 0) {
          var default_tag = editor.html.defaultTag();

          if (default_tag) {
            $hr.after($(editor.doc.createElement(default_tag)).append('<br>').get(0));
          } else {
            $hr.after('<br>');
          }
        }

        if ($hr.prev().is('hr')) {
          check = editor.selection.setAfter($hr.get(0), false);
        } else if ($hr.next().is('hr')) {
          check = editor.selection.setBefore($hr.get(0), false);
        } else {
          if (!editor.selection.setAfter($hr.get(0), false)) {
            editor.selection.setBefore($hr.get(0), false);
          }
        } // Added fix for this issue https://github.com/froala-labs/froala-editor-js-2/issues/384


        if (!check && typeof check !== 'undefined') {
          empty = "".concat(FroalaEditor.MARKERS, "<br>");
          empty = _createDefaultTag(empty);
          $hr.after(empty);
        }

        editor.selection.restore();
      },
      clearFormatting: function clearFormatting() {
        editor.format.remove();
      },
      selectAll: function selectAll() {
        editor.doc.execCommand('selectAll', false, false);
      },
      moreText: function moreText(cmd) {
        _moreExec(cmd);
      },
      moreParagraph: function moreParagraph(cmd) {
        _moreExec(cmd);
      },
      moreRich: function moreRich(cmd) {
        _moreExec(cmd);
      },
      moreMisc: function moreMisc(cmd) {
        _moreExec(cmd);
      }
    };
    /**
     * Executes more button commands
     */

    function _moreExec(cmd) {
      var $btn = editor.$tb.find("[data-cmd=".concat(cmd, "]")); // Toggle more button in the toolbar

      _toggleMoreButton($btn); // Set the height of all more toolbars


      editor.toolbar.setMoreToolbarsHeight();
    }
    /**
     * Display/Hide the toolbar buttons on clicking the more button
     */


    function _toggleMoreButton($btn) {
      // Get the corresponding button group for that more button
      var $buttonGroup = editor.$tb.find(".fr-more-toolbar[data-name=\"".concat($btn.attr('data-group-name'), "\"]")); // Hide all button groups before opening any one

      editor.$tb.find('.fr-open').not($btn).removeClass('fr-open');
      $btn.toggleClass('fr-open'); // Make sure we hide height properly.

      editor.$tb.find('.fr-more-toolbar').removeClass('fr-overflow-visible'); // We already have a more toolbar expanded.

      if (editor.$tb.find('.fr-expanded').not($buttonGroup).length) {
        // Toggle existing toolbar.
        editor.$tb.find('.fr-expanded').toggleClass('fr-expanded'); // Open the new toolbar.

        $buttonGroup.toggleClass('fr-expanded');
      } else {
        // Open toolbar.
        $buttonGroup.toggleClass('fr-expanded');
        editor.$box.toggleClass('fr-toolbar-open');
        editor.$tb.toggleClass('fr-toolbar-open');
      }
    }
    /**
     * Exec command.
     */


    function exec(cmd, params) {
      // Trigger before command to see if to execute the default callback.
      if (editor.events.trigger('commands.before', $.merge([cmd], params || [])) !== false) {
        // Get the callback.
        var callback = FroalaEditor.COMMANDS[cmd] && FroalaEditor.COMMANDS[cmd].callback || mapping[cmd];
        var focus = true;
        var accessibilityFocus = false;

        if (FroalaEditor.COMMANDS[cmd]) {
          if (typeof FroalaEditor.COMMANDS[cmd].focus !== 'undefined') {
            focus = FroalaEditor.COMMANDS[cmd].focus;
          }

          if (typeof FroalaEditor.COMMANDS[cmd].accessibilityFocus !== 'undefined') {
            accessibilityFocus = FroalaEditor.COMMANDS[cmd].accessibilityFocus;
          }
        } // Make sure we have focus.


        if (!editor.core.hasFocus() && focus && !editor.popups.areVisible() || !editor.core.hasFocus() && accessibilityFocus && editor.accessibility.hasFocus()) {
          // Focus in the editor at any position.
          editor.events.focus(true);
        } // Callback.
        // Save undo step.


        if (FroalaEditor.COMMANDS[cmd] && FroalaEditor.COMMANDS[cmd].undo !== false) {
          if (editor.$el.find('.fr-marker').length) {
            editor.events.disableBlur();
            editor.selection.restore();
          }

          editor.undo.saveStep();
        }

        if (callback) {
          callback.apply(editor, $.merge([cmd], params || []));
        } // Trigger after command.


        editor.events.trigger('commands.after', $.merge([cmd], params || [])); // Save undo step again.

        if (FroalaEditor.COMMANDS[cmd] && FroalaEditor.COMMANDS[cmd].undo !== false) {
          editor.undo.saveStep();
        }
      }
    }
    /**
     * Exex default.
     */


    function _execCommand(cmd, tag) {
      editor.format.toggle(tag);
    }

    function _processIndent(indent) {
      editor.selection.save();
      editor.html.wrap(true, true, true, true);
      editor.selection.restore();
      var blocks = editor.selection.blocks();

      for (var i = 0; i < blocks.length; i++) {
        if (blocks[i].tagName !== 'LI' || blocks[i].parentNode.tagName !== 'LI') {
          var $block = $(blocks[i]);

          if (blocks[i].tagName != 'LI' && blocks[i].parentNode.tagName == 'LI') {
            $block = $(blocks[i].parentNode);
          }

          var prop = editor.opts.direction === 'rtl' || $block.css('direction') === 'rtl' ? 'margin-right' : 'margin-left';
          var margin_left = editor.helpers.getPX($block.css(prop)); // Do not allow text to go out of the editor view.

          if ($block.width() < 2 * editor.opts.indentMargin && indent > 0) {
            continue;
          }

          $block.css(prop, Math.max(margin_left + indent * editor.opts.indentMargin, 0) || '');
          $block.removeClass('fr-temp-div');
        }
      }

      editor.selection.save();
      editor.html.unwrap();
      editor.selection.restore();
    }

    function callExec(k) {
      return function () {
        exec(k);
      };
    }

    var resp = {};

    for (var k in mapping) {
      if (Object.prototype.hasOwnProperty.call(mapping, k)) {
        resp[k] = callExec(k);
      }
    }

    function _init() {
      // Prevent typing in HR.
      editor.events.on('keydown', function (e) {
        var el = editor.selection.element();

        if (el && el.tagName === 'HR' && !editor.keys.isArrow(e.which)) {
          e.preventDefault();
          return false;
        }
      });
      editor.events.on('keyup', function (e) {
        var el = editor.selection.element();

        if (el && el.tagName === 'HR') {
          if (e.which === FroalaEditor.KEYCODE.ARROW_LEFT || e.which === FroalaEditor.KEYCODE.ARROW_UP) {
            if (el.previousSibling) {
              if (!editor.node.isBlock(el.previousSibling)) {
                $(el).before(FroalaEditor.MARKERS);
              } else {
                editor.selection.setAtEnd(el.previousSibling);
              }

              editor.selection.restore();
              return false;
            }
          } else if (e.which === FroalaEditor.KEYCODE.ARROW_RIGHT || e.which === FroalaEditor.KEYCODE.ARROW_DOWN) {
            if (el.nextSibling) {
              if (!editor.node.isBlock(el.nextSibling)) {
                $(el).after(FroalaEditor.MARKERS);
              } else {
                editor.selection.setAtStart(el.nextSibling);
              }

              editor.selection.restore();
              return false;
            }
          }
        }
      }); // Do not allow mousedown on HR.

      editor.events.on('mousedown', function (e) {
        if (e.target && e.target.tagName === 'HR') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }); // If somehow focus gets in HR remove it.

      editor.events.on('mouseup', function () {
        var s_el = editor.selection.element();
        var e_el = editor.selection.endElement();

        if (s_el === e_el && s_el && s_el.tagName === 'HR') {
          if (s_el.nextSibling) {
            if (!editor.node.isBlock(s_el.nextSibling)) {
              $(s_el).after(FroalaEditor.MARKERS);
            } else {
              editor.selection.setAtStart(s_el.nextSibling);
            }
          }

          editor.selection.restore();
        }
      });
    }

    return Object.assign(resp, {
      exec: exec,
      _init: _init
    });
  };

  FroalaEditor.MODULES.cursorLists = function (editor) {
    var $ = editor.$;
    /**
     * Find the first li parent.
     */

    function _firstParentLI(node) {
      var p_node = node;

      while (p_node.tagName !== 'LI') {
        p_node = p_node.parentNode;
      }

      return p_node;
    }
    /**
     * Find the first list parent.
     */


    function _firstParentList(node) {
      var p_node = node;

      while (!editor.node.isList(p_node)) {
        p_node = p_node.parentNode;
      }

      return p_node;
    }
    /**
     * Do enter at the beginning of a list item.
     */


    function _startEnter(marker) {
      var li = _firstParentLI(marker); // Get previous and next siblings.


      var next_li = li.nextSibling;
      var prev_li = li.previousSibling;
      var default_tag = editor.html.defaultTag();
      var ul; // We are in a list item at the middle of the list or an list item that is not empty.

      if (editor.node.isEmpty(li, true) && next_li) {
        var o_str = '';
        var c_str = '';
        var p_node = marker.parentNode; // Create open / close string.

        while (!editor.node.isList(p_node) && p_node.parentNode && (p_node.parentNode.tagName !== 'LI' || p_node.parentNode === li)) {
          o_str = editor.node.openTagString(p_node) + o_str;
          c_str += editor.node.closeTagString(p_node);
          p_node = p_node.parentNode;
        }

        o_str = editor.node.openTagString(p_node) + o_str;
        c_str += editor.node.closeTagString(p_node);
        var str = '';

        if (p_node.parentNode && p_node.parentNode.tagName === 'LI') {
          str = "".concat(c_str, "<li>").concat(FroalaEditor.MARKERS, "<br>").concat(o_str);
        } else if (default_tag) {
          str = "".concat(c_str, "<").concat(default_tag, ">").concat(FroalaEditor.MARKERS, "<br></").concat(default_tag, ">").concat(o_str);
        } else {
          str = "".concat(c_str + FroalaEditor.MARKERS, "<br>").concat(o_str);
        }

        while (['UL', 'OL'].indexOf(p_node.tagName) < 0 || p_node.parentNode && p_node.parentNode.tagName === 'LI') {
          p_node = p_node.parentNode;
        }

        $(li).replaceWith('<span id="fr-break"></span>');
        var html = editor.node.openTagString(p_node) + $(p_node).html() + editor.node.closeTagString(p_node);
        html = html.replace(/<span id="fr-break"><\/span>/g, str);
        $(p_node).replaceWith(html);
        editor.$el.find('li:empty').remove();
      } else if (prev_li && next_li || !editor.node.isEmpty(li, true)) {
        var br_str = '<br>';
        var nd = marker.parentNode;

        while (nd && nd.tagName !== 'LI') {
          br_str = editor.node.openTagString(nd) + br_str + editor.node.closeTagString(nd);
          nd = nd.parentNode;
        }

        $(li).before("<li>".concat(br_str, "</li>"));
        $(marker).remove();
      } // There is no previous list item so transform the current list item to an empty line.
      else if (!prev_li) {
          ul = _firstParentList(li); // We are in a nested list so add a new li before it.

          if (ul.parentNode && ul.parentNode.tagName === 'LI') {
            if (next_li) {
              $(ul.parentNode).before("".concat(editor.node.openTagString(li) + FroalaEditor.MARKERS, "<br></li>"));
            } else {
              $(ul.parentNode).after("".concat(editor.node.openTagString(li) + FroalaEditor.MARKERS, "<br></li>"));
            }
          } // We are in a normal list. Add a new line before.
          else if (default_tag) {
              $(ul).before("<".concat(default_tag, ">").concat(FroalaEditor.MARKERS, "<br></").concat(default_tag, ">"));
            } else {
              $(ul).before("".concat(FroalaEditor.MARKERS, "<br>"));
            } // Remove the current li.


          $(li).remove();
        } // There is no next_li item so transform the current list item to an empty line.
        else {
            ul = _firstParentList(li);
            var new_str = "".concat(FroalaEditor.MARKERS, "<br>");
            var ndx = marker.parentNode;

            while (ndx && ndx.tagName !== 'LI') {
              new_str = editor.node.openTagString(ndx) + new_str + editor.node.closeTagString(ndx);
              ndx = ndx.parentNode;
            } // We are in a nested lists so add a new li after it.


            if (ul.parentNode && ul.parentNode.tagName === 'LI') {
              $(ul.parentNode).after("<li>".concat(new_str, "</li>"));
            } // We are in a normal list. Add a new line after.
            else if (default_tag) {
                $(ul).after("<".concat(default_tag, ">").concat(new_str, "</").concat(default_tag, ">"));
              } else {
                $(ul).after(new_str);
              } // Remove the current li.


            $(li).remove();
          }
    }
    /**
     * Enter at the middle of a list.
     */


    function _middleEnter(marker) {
      var li = _firstParentLI(marker); // Build the closing / opening list item string.


      var str = '';
      var node = marker;
      var o_str = '';
      var c_str = '';
      var add_invisible = false;

      while (node !== li) {
        node = node.parentNode;
        var cls = node.tagName === 'A' && editor.cursor.isAtEnd(marker, node) ? 'fr-to-remove' : '';

        if (!add_invisible && node != li && !editor.node.isBlock(node)) {
          add_invisible = true;
          o_str = o_str + FroalaEditor.INVISIBLE_SPACE;
        }

        o_str = editor.node.openTagString($(node).clone().addClass(cls).get(0)) + o_str;
        c_str = editor.node.closeTagString(node) + c_str;
      } // Add markers.


      str = c_str + str + o_str + FroalaEditor.MARKERS + (editor.opts.keepFormatOnDelete ? FroalaEditor.INVISIBLE_SPACE : ''); // Build HTML.

      $(marker).replaceWith('<span id="fr-break"></span>');
      var html = editor.node.openTagString(li) + $(li).html() + editor.node.closeTagString(li);
      html = html.replace(/<span id="fr-break"><\/span>/g, str); // Replace the current list item.

      $(li).replaceWith(html);
    }
    /**
     * Enter at the end of a list item.
     */


    function _endEnter(marker) {
      var li = _firstParentLI(marker);

      var end_str = FroalaEditor.MARKERS;
      var start_str = '';
      var node = marker;
      var add_invisible = false;

      while (node !== li) {
        node = node.parentNode;
        var cls = node.tagName === 'A' && editor.cursor.isAtEnd(marker, node) ? 'fr-to-remove' : '';

        if (!add_invisible && node !== li && !editor.node.isBlock(node)) {
          add_invisible = true;
          start_str += FroalaEditor.INVISIBLE_SPACE;
        }

        start_str = editor.node.openTagString($(node).clone().addClass(cls).get(0)) + start_str;
        end_str += editor.node.closeTagString(node);
      }

      var str = start_str + end_str;
      $(marker).remove();
      $(li).after(str);
    }
    /**
     * Do backspace on a list item. This method is called only when wer are at the beginning of a LI.
     */


    function _backspace(marker) {
      var li = _firstParentLI(marker); // Get previous sibling.


      var prev_li = li.previousSibling; // There is a previous li.

      if (prev_li) {
        // Get the li inside a nested list or inner block tags.
        prev_li = $(prev_li).find(editor.html.blockTagsQuery()).get(-1) || prev_li; // Add markers.

        $(marker).replaceWith(FroalaEditor.MARKERS); // Remove possible BR at the end of the previous list.

        var contents = editor.node.contents(prev_li);

        if (contents.length && contents[contents.length - 1].tagName === 'BR') {
          $(contents[contents.length - 1]).remove();
        } // Remove any nodes that might be wrapped.


        $(li).find(editor.html.blockTagsQuery()).not('ol, ul, table').each(function () {
          if (this.parentNode === li) {
            $(this).replaceWith($(this).html() + (editor.node.isEmpty(this) ? '' : '<br>'));
          }
        }); // Append the current list item content to the previous one.

        var node = editor.node.contents(li)[0];
        var tmp;

        while (node && !editor.node.isList(node)) {
          tmp = node.nextSibling;
          $(prev_li).append(node);
          node = tmp;
        }

        prev_li = li.previousSibling;

        while (node) {
          tmp = node.nextSibling;
          $(prev_li).append(node);
          node = tmp;
        } // Remove ending BR.


        contents = editor.node.contents(prev_li);

        if (contents.length > 1 && contents[contents.length - 1].tagName === 'BR') {
          $(contents[contents.length - 1]).remove();
        } // Remove the current LI.


        $(li).remove();
      } // No previous li.
      else {
          var ul = _firstParentList(li); // Add markers.


          $(marker).replaceWith(FroalaEditor.MARKERS); // Nested lists.

          if (ul.parentNode && ul.parentNode.tagName === 'LI') {
            var prev_node = ul.previousSibling; // Previous node is block.

            if (editor.node.isBlock(prev_node)) {
              // Remove any nodes that might be wrapped.
              $(li).find(editor.html.blockTagsQuery()).not('ol, ul, table').each(function () {
                if (this.parentNode === li) {
                  $(this).replaceWith($(this).html() + (editor.node.isEmpty(this) ? '' : '<br>'));
                }
              });
              $(prev_node).append($(li).html());
            } // Text right in li.
            else {
                $(ul).before($(li).html());
              }
          } // Normal lists. Add an empty li instead.
          else {
              var default_tag = editor.html.defaultTag();

              if (default_tag && $(li).find(editor.html.blockTagsQuery()).length === 0) {
                $(ul).before("<".concat(default_tag, ">").concat($(li).html(), "</").concat(default_tag, ">"));
              } else {
                $(ul).before($(li).html());
              }
            } // Remove the current li.


          $(li).remove();
          editor.html.wrap(); // Remove the ul if it is empty.

          if ($(ul).find('li').length === 0) {
            $(ul).remove();
          }
        }
    }
    /**
     * Delete at the end of list item.
     */


    function _del(marker) {
      var li = _firstParentLI(marker);

      var next_li = li.nextSibling;
      var contents; // There is a next li.

      if (next_li) {
        // Remove possible BR at the beginning of the next LI.
        contents = editor.node.contents(next_li);

        if (contents.length && contents[0].tagName === 'BR') {
          $(contents[0]).remove();
        } // Unwrap content from the next node.


        $(next_li).find(editor.html.blockTagsQuery()).not('ol, ul, table').each(function () {
          if (this.parentNode === next_li) {
            $(this).replaceWith($(this).html() + (editor.node.isEmpty(this) ? '' : '<br>'));
          }
        }); // Append the next LI to the current LI.

        var last_node = marker;
        var node = editor.node.contents(next_li)[0];
        var tmp;

        while (node && !editor.node.isList(node)) {
          tmp = node.nextSibling;
          $(last_node).after(node);
          last_node = node;
          node = tmp;
        } // Append nested lists.


        while (node) {
          tmp = node.nextSibling;
          $(li).append(node);
          node = tmp;
        } // Replace marker with markers.


        $(marker).replaceWith(FroalaEditor.MARKERS); // Remove next li.

        $(next_li).remove();
      } // No next li.
      else {
          // Search the next sibling in parents.
          var next_node = li;

          while (!next_node.nextSibling && next_node !== editor.el) {
            next_node = next_node.parentNode;
          } // We're right at the end.


          if (next_node === editor.el) {
            return false;
          } // Get the next sibling.


          next_node = next_node.nextSibling; // Next sibling is a block tag.

          if (editor.node.isBlock(next_node)) {
            // Check if we can do delete in it.
            if (FroalaEditor.NO_DELETE_TAGS.indexOf(next_node.tagName) < 0) {
              // Add markers.
              $(marker).replaceWith(FroalaEditor.MARKERS); // Remove any possible BR at the end of the LI.

              contents = editor.node.contents(li);

              if (contents.length && contents[contents.length - 1].tagName === 'BR') {
                $(contents[contents.length - 1]).remove();
              } // Append next node.


              $(li).append($(next_node).html()); // Remove the next node.

              $(next_node).remove();
            }
          } // Append everything till the next block tag or BR.
          else {
              // Remove any possible BR at the end of the LI.
              contents = editor.node.contents(li);

              if (contents.length && contents[contents.length - 1].tagName === 'BR') {
                $(contents[contents.length - 1]).remove();
              } // var next_node = next_li;


              $(marker).replaceWith(FroalaEditor.MARKERS);

              while (next_node && !editor.node.isBlock(next_node) && next_node.tagName !== 'BR') {
                $(li).append($(next_node));
                next_node = next_node.nextSibling;
              }
            }
        }
    }

    return {
      _startEnter: _startEnter,
      _middleEnter: _middleEnter,
      _endEnter: _endEnter,
      _backspace: _backspace,
      _del: _del
    };
  };

  FroalaEditor.NO_DELETE_TAGS = ['TH', 'TD', 'TR', 'TABLE', 'FORM']; // Do simple enter.

  FroalaEditor.SIMPLE_ENTER_TAGS = ['TH', 'TD', 'LI', 'DL', 'DT', 'FORM'];

  FroalaEditor.MODULES.cursor = function (editor) {
    var $ = editor.$;
    /**
     * Check if node is at the end of a block tag.
     */

    function _atEnd(node) {
      if (!node) {
        return false;
      }

      if (editor.node.isBlock(node)) {
        return true;
      }

      if (node.nextSibling && node.nextSibling.nodeType === Node.TEXT_NODE && node.nextSibling.textContent.replace(/\u200b/g, '').length === 0) {
        return _atEnd(node.nextSibling);
      }

      if (node.nextSibling && !(node.previousSibling && node.nextSibling.tagName === 'BR' && !node.nextSibling.nextSibling)) {
        return false;
      }

      return _atEnd(node.parentNode);
    }
    /**
     * Check if node is at the start of a block tag.
     */


    function _atStart(node) {
      if (!node) {
        return false;
      }

      if (editor.node.isBlock(node)) {
        return true;
      }

      if (node.previousSibling && node.previousSibling.nodeType === Node.TEXT_NODE && node.previousSibling.textContent.replace(/\u200b/g, '').length === 0) {
        return _atStart(node.previousSibling);
      }

      if (node.previousSibling) {
        return false;
      }

      if (!node.previousSibling && editor.node.hasClass(node.parentNode, 'fr-inner')) {
        return true;
      }

      return _atStart(node.parentNode);
    }
    /**
     * Check if node is a the start of the container.
     */


    function _isAtStart(node, container) {
      if (!node) {
        return false;
      }

      if (node === editor.$wp.get(0)) {
        return false;
      }

      if (node.previousSibling && node.previousSibling.nodeType === Node.TEXT_NODE && node.previousSibling.textContent.replace(/\u200b/g, '').length === 0) {
        return _isAtStart(node.previousSibling, container);
      }

      if (node.previousSibling) {
        return false;
      }

      if (node.parentNode === container) {
        return true;
      }

      return _isAtStart(node.parentNode, container);
    }
    /**
     * Check if node is a the start of the container.
     */


    function _isAtEnd(node, container) {
      if (!node) {
        return false;
      }

      if (node === editor.$wp.get(0)) {
        return false;
      }

      if (node.nextSibling && node.nextSibling.nodeType === Node.TEXT_NODE && node.nextSibling.textContent.replace(/\u200b/g, '').length === 0) {
        return _isAtEnd(node.nextSibling, container);
      }

      if (node.nextSibling && !(node.previousSibling && node.nextSibling.tagName === 'BR' && !node.nextSibling.nextSibling)) {
        return false;
      }

      if (node.parentNode === container) {
        return true;
      }

      return _isAtEnd(node.parentNode, container);
    }
    /**
     * Check if the node is inside a LI.
     */


    function _inLi(node) {
      return $(node).parentsUntil(editor.$el, 'LI').length > 0 && $(node).parentsUntil('LI', 'TABLE').length === 0;
    }
    /**
     * Get the length of the first or last character from text. Note: A special character can contain 1, 2 or 4 javascript 16bits characters.
     */


    function _getExtremityCharacterLength(text, first) {
      var special_chars_regex = new RegExp("".concat(first ? '^' : '', "(([\\uD83C-\\uDBFF\\uDC00-\\uDFFF]+\\u200D)*[\\uD83C-\\uDBFF\\uDC00-\\uDFFF]{2})").concat(first ? '' : '$'), 'i');
      var matches = text.match(special_chars_regex); // No matches means there is a normal character.

      if (!matches) {
        return 1;
      } // Special character match. Can be 1, 2 or 4 characters.


      return matches[0].length;
    }
    /**
     * Do backspace at the start of a block tag.
     */


    function _startBackspace(marker) {
      var quote = $(marker).parentsUntil(editor.$el, 'BLOCKQUOTE').length > 0;
      var deep_parent = editor.node.deepestParent(marker, [], !quote);
      var current_block = deep_parent; // Check for nested block tags if no previous element.

      while (deep_parent && !deep_parent.previousSibling && deep_parent.tagName !== 'BLOCKQUOTE' && deep_parent.parentElement !== editor.el && !editor.node.hasClass(deep_parent.parentElement, 'fr-inner') && FroalaEditor.SIMPLE_ENTER_TAGS.indexOf(deep_parent.parentElement.tagName) < 0) {
        deep_parent = deep_parent.parentElement;
      }

      if (deep_parent && deep_parent.tagName === 'BLOCKQUOTE') {
        var m_parent = editor.node.deepestParent(marker, [$(marker).parentsUntil(editor.$el, 'BLOCKQUOTE').get(0)]);

        if (m_parent && m_parent.previousSibling) {
          deep_parent = m_parent;
          current_block = m_parent;
        }
      } // Deepest parent is not the main element.


      if (deep_parent !== null) {
        var prev_node = deep_parent.previousSibling;
        var contents; // We are inside a block tag.

        if (editor.node.isBlock(deep_parent) && editor.node.isEditable(deep_parent)) {
          // There is a previous node.
          if (prev_node && FroalaEditor.NO_DELETE_TAGS.indexOf(prev_node.tagName) < 0) {
            if (editor.node.isDeletable(prev_node)) {
              $(prev_node).remove();
              $(marker).replaceWith(FroalaEditor.MARKERS);
            } else {
              // Previous node is a block tag.
              if (editor.node.isEditable(prev_node)) {
                if (editor.node.isBlock(prev_node)) {
                  if (editor.node.isEmpty(prev_node) && !editor.node.isList(prev_node)) {
                    $(prev_node).remove(); // https://github.com/froala/wysiwyg-editor/issues/1877.

                    $(marker).after(editor.opts.keepFormatOnDelete ? FroalaEditor.INVISIBLE_SPACE : '');
                  } else {
                    if (editor.node.isList(prev_node)) {
                      prev_node = $(prev_node).find('li').last().get(0);
                    } // Remove last BR.


                    contents = editor.node.contents(prev_node);

                    if (contents.length && contents[contents.length - 1].tagName === 'BR') {
                      $(contents[contents.length - 1]).remove();
                    } // Prev node is blockquote but the current one isn't.


                    if (prev_node.tagName === 'BLOCKQUOTE' && deep_parent.tagName !== 'BLOCKQUOTE') {
                      contents = editor.node.contents(prev_node);

                      while (contents.length && editor.node.isBlock(contents[contents.length - 1])) {
                        prev_node = contents[contents.length - 1];
                        contents = editor.node.contents(prev_node);
                      }
                    } // Prev node is not blockquote, but the current one is.
                    else if (prev_node.tagName !== 'BLOCKQUOTE' && current_block.tagName === 'BLOCKQUOTE') {
                        contents = editor.node.contents(current_block);

                        while (contents.length && editor.node.isBlock(contents[0])) {
                          current_block = contents[0];
                          contents = editor.node.contents(current_block);
                        }
                      } // When current node is empty place the cursor at the end of the prev node.


                    if (editor.node.isEmpty(deep_parent)) {
                      $(marker).remove();
                      editor.selection.setAtEnd(prev_node, true);
                    } // Replace marker with markers.
                    else {
                        $(marker).replaceWith(FroalaEditor.MARKERS); // Previous node may have only block children.

                        var prev_children = prev_node.childNodes; // Append to prev node current HTML

                        if (!editor.node.isBlock(prev_children[prev_children.length - 1])) {
                          $(prev_node).append(current_block.innerHTML);
                        } else {
                          // Append the HTML to the last child of the previous node.
                          $(prev_children[prev_children.length - 1]).append(current_block.innerHTML);
                        }
                      } // Remove current block.


                    $(current_block).remove(); // Remove current deep parent if empty.

                    if (editor.node.isEmpty(deep_parent)) {
                      $(deep_parent).remove();
                    }
                  }
                } else {
                  $(marker).replaceWith(FroalaEditor.MARKERS);

                  if (deep_parent.tagName === 'BLOCKQUOTE' && prev_node.nodeType === Node.ELEMENT_NODE) {
                    $(prev_node).remove();
                  } else {
                    $(prev_node).after(editor.node.isEmpty(deep_parent) ? '' : $(deep_parent).html());
                    $(deep_parent).remove();

                    if (prev_node.tagName === 'BR') {
                      $(prev_node).remove();
                    }
                  }
                }
              }
            }
          } else if (!prev_node) {
            if (deep_parent && deep_parent.tagName === 'BLOCKQUOTE' && $(deep_parent).text().replace(/\u200B/g, '').length === 0) {
              $(deep_parent).remove();
            } else {
              // https://github.com/froala-labs/froala-editor-js-2/issues/1304
              if (editor.node.isEmpty(deep_parent) && deep_parent.parentNode && editor.node.isEditable(deep_parent.parentNode)) {
                // check for the editor el
                if (deep_parent.parentNode != editor.el) {
                  $(deep_parent.parentNode).remove();
                }
              }
            }
          }
        } // This should never happen.

          /* jshint ignore:end */

          /* jscs:enable */

      }
    }
    /**
     * Do backspace at the middle of a block tag.
     */


    function _middleBackspace(marker) {
      var prev_node = marker; // Get the parent node that has a prev sibling.

      while (!prev_node.previousSibling) {
        prev_node = prev_node.parentNode;

        if (editor.node.isElement(prev_node)) {
          return false;
        }
      }

      prev_node = prev_node.previousSibling; // Not block tag.

      var contents;

      if (!editor.node.isBlock(prev_node) && editor.node.isEditable(prev_node)) {
        contents = editor.node.contents(prev_node); // Previous node is text.

        while (prev_node.nodeType !== Node.TEXT_NODE && !editor.node.isDeletable(prev_node) && contents.length && editor.node.isEditable(prev_node)) {
          prev_node = contents[contents.length - 1];
          contents = editor.node.contents(prev_node);
        }

        if (prev_node.nodeType === Node.TEXT_NODE) {
          var txt = prev_node.textContent;
          var len = txt.length; // We have a \n character.

          if (txt.length && txt[txt.length - 1] === '\n') {
            prev_node.textContent = txt.substring(0, len - 2);

            if (prev_node.textContent.length === 0) {
              prev_node.parentNode.removeChild(prev_node);
            }

            return _middleBackspace(marker);
          } // Tab UNDO.


          if (editor.opts.tabSpaces && txt.length >= editor.opts.tabSpaces) {
            var tab_str = txt.substr(txt.length - editor.opts.tabSpaces, txt.length - 1);

            if (tab_str.replace(/ /g, '').replace(new RegExp(FroalaEditor.UNICODE_NBSP, 'g'), '').length === 0) {
              len = txt.length - editor.opts.tabSpaces + 1;
            }
          }

          prev_node.textContent = txt.substring(0, len - _getExtremityCharacterLength(txt)); // https://github.com/froala/wysiwyg-editor/issues/3034

          if (editor.opts.htmlUntouched && !marker.nextSibling && prev_node.textContent.length && prev_node.textContent[prev_node.textContent.length - 1] === ' ') {
            prev_node.textContent = prev_node.textContent.substring(0, prev_node.textContent.length - 1) + FroalaEditor.UNICODE_NBSP;
          }

          var deleted = txt.length !== prev_node.textContent.length; // Remove nodwhile (!editor.node.isElement(preve if empty.

          if (prev_node.textContent.length === 0) {
            // Here we check to see if we should keep the current formatting.
            if (deleted && editor.opts.keepFormatOnDelete) {
              $(prev_node).after(FroalaEditor.INVISIBLE_SPACE + FroalaEditor.MARKERS);
            } else {
              if (txt.length === 0 || !editor.node.isBlock(prev_node.parentNode)) {
                // Condition prev_node.parentNode.childNodes.length == 1 is from https://github.com/froala/wysiwyg-editor/issues/1855 .
                if ((prev_node.parentNode.childNodes.length == 2 && prev_node.parentNode == marker.parentNode || prev_node.parentNode.childNodes.length == 1) && !editor.node.isBlock(prev_node.parentNode) && !editor.node.isElement(prev_node.parentNode) && editor.node.isDeletable(prev_node.parentNode)) {
                  $(prev_node.parentNode).after(FroalaEditor.MARKERS);
                  $(prev_node.parentNode).remove();
                } else {
                  // https://github.com/froala/wysiwyg-editor/issues/2626.
                  while (!editor.node.isElement(prev_node.parentNode) && editor.node.isEmpty(prev_node.parentNode) && FroalaEditor.NO_DELETE_TAGS.indexOf(prev_node.parentNode.tagName) < 0) {
                    var t_node = prev_node;
                    prev_node = prev_node.parentNode;
                    t_node.parentNode.removeChild(t_node);
                  }

                  $(prev_node).after(FroalaEditor.MARKERS); // https://github.com/froala/wysiwyg-editor/issues/1379.

                  if (editor.node.isElement(prev_node.parentNode) && !marker.nextSibling && prev_node.previousSibling && prev_node.previousSibling.tagName === 'BR') {
                    $(marker).after('<br>');
                  }

                  prev_node.parentNode.removeChild(prev_node);
                }
              } else {
                $(prev_node).after(FroalaEditor.MARKERS);
              }
            }
          } else {
            $(prev_node).after(FroalaEditor.MARKERS);
          }
        } else if (editor.node.isDeletable(prev_node)) {
          $(prev_node).after(FroalaEditor.MARKERS);
          $(prev_node).remove();
        } else if (marker.nextSibling && marker.nextSibling.tagName === 'BR' && editor.node.isVoid(prev_node) && prev_node.tagName !== 'BR') {
          $(marker.nextSibling).remove();
          $(marker).replaceWith(FroalaEditor.MARKERS);
        } else if (editor.events.trigger('node.remove', [$(prev_node)]) !== false) {
          $(prev_node).after(FroalaEditor.MARKERS);
          $(prev_node).remove();
        }
      } // Block tag but we are allowed to delete it.
      else if (FroalaEditor.NO_DELETE_TAGS.indexOf(prev_node.tagName) < 0 && (editor.node.isEditable(prev_node) || editor.node.isDeletable(prev_node))) {
          if (editor.node.isDeletable(prev_node)) {
            $(marker).replaceWith(FroalaEditor.MARKERS);
            $(prev_node).remove();
          } else if (editor.node.isEmpty(prev_node) && !editor.node.isList(prev_node)) {
            $(prev_node).remove();
            $(marker).replaceWith(FroalaEditor.MARKERS);
          } else {
            // List correction.
            if (editor.node.isList(prev_node)) {
              prev_node = $(prev_node).find('li').last().get(0);
            }

            contents = editor.node.contents(prev_node);

            if (contents && contents[contents.length - 1].tagName === 'BR') {
              $(contents[contents.length - 1]).remove();
            }

            contents = editor.node.contents(prev_node);

            while (contents && editor.node.isBlock(contents[contents.length - 1])) {
              prev_node = contents[contents.length - 1];
              contents = editor.node.contents(prev_node);
            }

            $(prev_node).append(FroalaEditor.MARKERS);
            var next_node = marker;

            while (!next_node.previousSibling) {
              next_node = next_node.parentNode;
            }

            while (next_node && next_node.tagName !== 'BR' && !editor.node.isBlock(next_node)) {
              var copy_node = next_node;
              next_node = next_node.nextSibling;
              $(prev_node).append(copy_node);
            } // Remove BR.


            if (next_node && next_node.tagName === 'BR') {
              $(next_node).remove();
            }

            $(marker).remove();
          }
        } else if (marker.nextSibling && marker.nextSibling.tagName === 'BR') {
          $(marker.nextSibling).remove();
        }

      return true;
    }
    /**
     * Do backspace.
     */


    function backspace() {
      var do_default = false; // Add a marker in HTML.

      var marker = editor.markers.insert();

      if (!marker) {
        return true;
      } // Do not allow edit inside contenteditable="false".


      var p_node = marker.parentNode;

      while (p_node && !editor.node.isElement(p_node)) {
        if (p_node.getAttribute('contenteditable') === 'false') {
          $(marker).replaceWith(FroalaEditor.MARKERS);
          editor.selection.restore();
          return false;
        } else if (p_node.getAttribute('contenteditable') === 'true') {
          break;
        }

        p_node = p_node.parentNode;
      }

      editor.el.normalize(); // We should remove invisible space first of all.

      var prev_node = marker.previousSibling;

      if (prev_node) {
        var txt = prev_node.textContent; // Check if we have an invisible space before the marker.

        if (txt && txt.length && txt.charCodeAt(txt.length - 1) === 8203) {
          if (txt.length === 1) {
            $(prev_node).remove();
          } else {
            prev_node.textContent = prev_node.textContent.substr(0, txt.length - _getExtremityCharacterLength(txt));
          }
        }
      } // Delete at end.


      if (_atEnd(marker)) {
        if (_inLi(marker) && _isAtStart(marker, $(marker).parents('li').first().get(0))) {
          editor.cursorLists._backspace(marker);
        } else {
          do_default = _middleBackspace(marker);
        }
      } // Delete at start.
      else if (_atStart(marker)) {
          if (_inLi(marker) && _isAtStart(marker, $(marker).parents('li').first().get(0))) {
            editor.cursorLists._backspace(marker);
          } else {
            _startBackspace(marker);
          }
        } // Delete at middle.
        else {
            do_default = _middleBackspace(marker);
          }

      $(marker).remove();

      _cleanEmptyBlockquotes();

      editor.html.fillEmptyBlocks(true);

      if (!editor.opts.htmlUntouched) {
        editor.html.cleanEmptyTags();
        editor.clean.lists();
        editor.spaces.normalizeAroundCursor();
      }

      editor.selection.restore();
      return do_default;
    }
    /**
     * Delete at the end of a block tag.
     */


    function _endDel(marker) {
      var quote = $(marker).parentsUntil(editor.$el, 'BLOCKQUOTE').length > 0;
      var deep_parent = editor.node.deepestParent(marker, [], !quote);

      if (deep_parent && deep_parent.tagName === 'BLOCKQUOTE') {
        var m_parent = editor.node.deepestParent(marker, [$(marker).parentsUntil(editor.$el, 'BLOCKQUOTE').get(0)]);

        if (m_parent && m_parent.nextSibling) {
          deep_parent = m_parent;
        }
      } // Deepest parent is not the main element.


      if (deep_parent !== null) {
        var next_node = deep_parent.nextSibling;
        var contents; // We are inside a block tag.

        if (editor.node.isBlock(deep_parent) && (editor.node.isEditable(deep_parent) || editor.node.isDeletable(deep_parent))) {
          // There is a next node.
          if (next_node && FroalaEditor.NO_DELETE_TAGS.indexOf(next_node.tagName) < 0) {
            if (editor.node.isDeletable(next_node)) {
              $(next_node).remove();
              $(marker).replaceWith(FroalaEditor.MARKERS);
            } else {
              // Next node is a block tag.
              if (editor.node.isBlock(next_node) && editor.node.isEditable(next_node)) {
                // Next node is a list.
                if (editor.node.isList(next_node)) {
                  // Current block tag is empty.
                  if (editor.node.isEmpty(deep_parent, true)) {
                    $(deep_parent).remove();
                    $(next_node).find('li').first().prepend(FroalaEditor.MARKERS);
                  } else {
                    var $li = $(next_node).find('li').first();

                    if (deep_parent.tagName === 'BLOCKQUOTE') {
                      contents = editor.node.contents(deep_parent);

                      if (contents.length && editor.node.isBlock(contents[contents.length - 1])) {
                        deep_parent = contents[contents.length - 1];
                      }
                    } // There are no nested lists.


                    if ($li.find('ul, ol').length === 0) {
                      $(marker).replaceWith(FroalaEditor.MARKERS); // Remove any nodes that might be wrapped.

                      $li.find(editor.html.blockTagsQuery()).not('ol, ul, table').each(function () {
                        if (this.parentNode === $li.get(0)) {
                          $(this).replaceWith($(this).html() + (editor.node.isEmpty(this) ? '' : '<br>'));
                        }
                      });
                      $(deep_parent).append(editor.node.contents($li.get(0)));
                      $li.remove();

                      if ($(next_node).find('li').length === 0) {
                        $(next_node).remove();
                      }
                    }
                  }
                } else {
                  // Remove last BR.
                  contents = editor.node.contents(next_node);

                  if (contents.length && contents[0].tagName === 'BR') {
                    $(contents[0]).remove();
                  }

                  if (next_node.tagName !== 'BLOCKQUOTE' && deep_parent.tagName === 'BLOCKQUOTE') {
                    contents = editor.node.contents(deep_parent);

                    while (contents.length && editor.node.isBlock(contents[contents.length - 1])) {
                      deep_parent = contents[contents.length - 1];
                      contents = editor.node.contents(deep_parent);
                    }
                  } else if (next_node.tagName === 'BLOCKQUOTE' && deep_parent.tagName !== 'BLOCKQUOTE') {
                    contents = editor.node.contents(next_node);

                    while (contents.length && editor.node.isBlock(contents[0])) {
                      next_node = contents[0];
                      contents = editor.node.contents(next_node);
                    }
                  }

                  $(marker).replaceWith(FroalaEditor.MARKERS);
                  $(deep_parent).append(next_node.innerHTML);
                  $(next_node).remove();
                }
              } else {
                $(marker).replaceWith(FroalaEditor.MARKERS); // var next_node = next_node.nextSibling;

                while (next_node && next_node.tagName !== 'BR' && !editor.node.isBlock(next_node) && editor.node.isEditable(next_node)) {
                  var copy_node = next_node;
                  next_node = next_node.nextSibling;
                  $(deep_parent).append(copy_node);
                }

                if (next_node && next_node.tagName === 'BR' && editor.node.isEditable(next_node)) {
                  $(next_node).remove();
                }
              }
            }
          }
        } // This should never happen.

          /* jshint ignore:end */

          /* jscs:enable */

      }
    }
    /**
     * Delete at the middle of a block tag.
     */


    function _middleDel(marker) {
      var next_node = marker; // Get the parent node that has a next sibling.

      while (!next_node.nextSibling) {
        next_node = next_node.parentNode;

        if (editor.node.isElement(next_node)) {
          return false;
        }
      }

      next_node = next_node.nextSibling; // Handle the case when the next node is a BR.

      if (next_node.tagName === 'BR' && editor.node.isEditable(next_node)) {
        // There is a next sibling.
        if (next_node.nextSibling) {
          if (editor.node.isBlock(next_node.nextSibling) && editor.node.isEditable(next_node.nextSibling)) {
            if (FroalaEditor.NO_DELETE_TAGS.indexOf(next_node.nextSibling.tagName) < 0) {
              next_node = next_node.nextSibling;
              $(next_node.previousSibling).remove();
            } else {
              $(next_node).remove();
              return;
            }
          }
        } // No next sibling. We should check if BR is at the end.
        else if (_atEnd(next_node)) {
            if (_inLi(marker)) {
              editor.cursorLists._del(marker);
            } else {
              var deep_parent = editor.node.deepestParent(next_node);

              if (deep_parent) {
                if (!editor.node.isEmpty(editor.node.blockParent(next_node)) || (editor.node.blockParent(next_node).nextSibling && FroalaEditor.NO_DELETE_TAGS.indexOf(editor.node.blockParent(next_node).nextSibling.tagName)) < 0) {
                  $(next_node).remove();
                }

                _endDel(marker);
              }
            }

            return;
          }
      } // Not block tag.


      var contents;

      if (!editor.node.isBlock(next_node) && editor.node.isEditable(next_node)) {
        contents = editor.node.contents(next_node); // Next node is text.

        while (next_node.nodeType !== Node.TEXT_NODE && contents.length && !editor.node.isDeletable(next_node) && editor.node.isEditable(next_node)) {
          next_node = contents[0];
          contents = editor.node.contents(next_node);
        }

        if (next_node.nodeType === Node.TEXT_NODE) {
          $(next_node).before(FroalaEditor.MARKERS);

          if (next_node.textContent.length) {
            next_node.textContent = next_node.textContent.substring(_getExtremityCharacterLength(next_node.textContent, true), next_node.textContent.length);
          }
        } else if (editor.node.isDeletable(next_node)) {
          $(next_node).before(FroalaEditor.MARKERS);
          $(next_node).remove();
        } else if (editor.events.trigger('node.remove', [$(next_node)]) !== false) {
          $(next_node).before(FroalaEditor.MARKERS);
          $(next_node).remove();
        }

        $(marker).remove();
      } // Block tag.
      else if (FroalaEditor.NO_DELETE_TAGS.indexOf(next_node.tagName) < 0 && (editor.node.isEditable(next_node) || editor.node.isDeletable(next_node))) {
          if (editor.node.isDeletable(next_node)) {
            $(marker).replaceWith(FroalaEditor.MARKERS);
            $(next_node).remove();
          } else if (editor.node.isList(next_node)) {
            // There is a previous sibling.
            if (marker.previousSibling) {
              $(next_node).find('li').first().prepend(marker);

              editor.cursorLists._backspace(marker);
            } // No previous sibling.
            else {
                $(next_node).find('li').first().prepend(FroalaEditor.MARKERS);
                $(marker).remove();
              }
          } else {
            contents = editor.node.contents(next_node);

            if (contents && contents[0].tagName === 'BR') {
              $(contents[0]).remove();
            } // Deal with blockquote.


            if (contents && next_node.tagName === 'BLOCKQUOTE') {
              var node = contents[0];
              $(marker).before(FroalaEditor.MARKERS);

              while (node && node.tagName !== 'BR') {
                var tmp = node;
                node = node.nextSibling;
                $(marker).before(tmp);
              }

              if (node && node.tagName === 'BR') {
                $(node).remove();
              }
            } else {
              $(marker).after($(next_node).html()).after(FroalaEditor.MARKERS);
              $(next_node).remove();
            }
          }
        }
    }
    /**
     * Delete.
     */


    function del() {
      var marker = editor.markers.insert();

      if (!marker) {
        return false;
      }

      editor.el.normalize(); // Delete at end.

      if (_atEnd(marker)) {
        if (_inLi(marker)) {
          if ($(marker).parents('li').first().find('ul, ol').length === 0) {
            editor.cursorLists._del(marker);
          } else {
            var $li = $(marker).parents('li').first().find('ul, ol').first().find('li').first();
            $li = $li.find(editor.html.blockTagsQuery()).get(-1) || $li;
            $li.prepend(marker);

            editor.cursorLists._backspace(marker);
          }
        } else {
          _endDel(marker);
        }
      } // Delete at start.
      else if (_atStart(marker)) {
          _middleDel(marker);
        } // Delete at middle.
        else {
            _middleDel(marker);
          }

      $(marker).remove();

      _cleanEmptyBlockquotes();

      editor.html.fillEmptyBlocks(true);

      if (!editor.opts.htmlUntouched) {
        editor.html.cleanEmptyTags();
        editor.clean.lists();
      }

      editor.spaces.normalizeAroundCursor();
      editor.selection.restore();
    }

    function _cleanEmptyBlockquotes() {
      var blks = editor.el.querySelectorAll('blockquote:empty');

      for (var i = 0; i < blks.length; i++) {
        blks[i].parentNode.removeChild(blks[i]);
      }
    }

    function _cleanNodesToRemove() {
      editor.$el.find('.fr-to-remove').each(function () {
        var contents = editor.node.contents(this);

        for (var i = 0; i < contents.length; i++) {
          if (contents[i].nodeType === Node.TEXT_NODE) {
            contents[i].textContent = contents[i].textContent.replace(/\u200B/g, '');
          }
        }

        $(this).replaceWith(this.innerHTML);
      });
    }
    /**
     * Enter at the end of a block tag.
     */


    function _endEnter(marker, shift, quote) {
      var deep_parent = editor.node.deepestParent(marker, [], !quote);
      var default_tag;

      if (deep_parent && deep_parent.tagName === 'BLOCKQUOTE') {
        if (_isAtEnd(marker, deep_parent)) {
          default_tag = editor.html.defaultTag();

          if (!shift) {
            if (default_tag) {
              $(deep_parent).after("<".concat(default_tag, ">").concat(FroalaEditor.MARKERS, "<br></").concat(default_tag, ">"));
            } else {
              $(deep_parent).after("".concat(FroalaEditor.MARKERS, "<br>"));
            }
          } else {
            $(marker).replaceWith('<br>' + FroalaEditor.MARKERS);
          }

          $(marker).remove();
          return false;
        }

        _middleEnter(marker, shift, quote);

        return false;
      } // We are right in the main element.


      if (deep_parent === null) {
        default_tag = editor.html.defaultTag();

        if (!default_tag || !editor.node.isElement(marker.parentNode)) {
          if (marker.previousSibling && !$(marker.previousSibling).is('br') && !marker.nextSibling) {
            $(marker).replaceWith("<br>".concat(FroalaEditor.MARKERS, "<br>"));
          } else {
            $(marker).replaceWith("<br>".concat(FroalaEditor.MARKERS));
          }
        } else {
          $(marker).replaceWith("<".concat(default_tag, ">").concat(FroalaEditor.MARKERS, "<br></").concat(default_tag, ">"));
        }
      } // There is a parent.
      else {
          // Block tag parent.
          var c_node = marker;
          var str = '';

          if (deep_parent.tagName == 'PRE' && !marker.nextSibling) {
            shift = true;
          }

          if (!editor.node.isBlock(deep_parent) || shift) {
            str = '<br/>';
          }

          var c_str = '';
          var o_str = '';
          default_tag = editor.html.defaultTag();
          var open_default_tag = '';
          var close_default_tag = '';

          if (default_tag && editor.node.isBlock(deep_parent)) {
            open_default_tag = "<".concat(default_tag, ">");
            close_default_tag = "</".concat(default_tag, ">");

            if (deep_parent.tagName === default_tag.toUpperCase()) {
              open_default_tag = editor.node.openTagString($(deep_parent).clone().removeAttr('id').get(0));
            }
          }

          do {
            c_node = c_node.parentNode; // Shift condition.

            if (!shift || c_node !== deep_parent || shift && !editor.node.isBlock(deep_parent)) {
              c_str += editor.node.closeTagString(c_node); // Open str when there is a block parent.

              if (c_node === deep_parent && editor.node.isBlock(deep_parent)) {
                o_str = open_default_tag + o_str;
              } else {
                var cls = (c_node.tagName === 'A' || editor.node.hasClass(c_node, 'fa')) && _isAtEnd(marker, c_node) ? 'fr-to-remove' : '';
                o_str = editor.node.openTagString($(c_node).clone().addClass(cls).get(0)) + o_str;
              }
            }
          } while (c_node !== deep_parent); // Add BR if deep parent is block tag.


          str = c_str + str + o_str + (marker.parentNode === deep_parent && editor.node.isBlock(deep_parent) ? '' : FroalaEditor.INVISIBLE_SPACE) + FroalaEditor.MARKERS;

          if (editor.node.isBlock(deep_parent) && !$(deep_parent).find('*').last().is('br')) {
            $(deep_parent).append('<br/>');
          }

          $(marker).after('<span id="fr-break"></span>');
          $(marker).remove(); // Add a BR after to make sure we display the last line.

          if ((!deep_parent.nextSibling || editor.node.isBlock(deep_parent.nextSibling)) && !editor.node.isBlock(deep_parent)) {
            $(deep_parent).after('<br>');
          }

          var html; // No shift.

          if (!shift && editor.node.isBlock(deep_parent)) {
            html = editor.node.openTagString(deep_parent) + $(deep_parent).html() + close_default_tag;
          } else {
            html = editor.node.openTagString(deep_parent) + $(deep_parent).html() + editor.node.closeTagString(deep_parent);
          }

          html = html.replace(/<span id="fr-break"><\/span>/g, str);
          $(deep_parent).replaceWith(html);
        }
    }
    /**
     * Start at the beginning of a block tag.
     */


    function _startEnter(marker, shift, quote) {
      var deep_parent = editor.node.deepestParent(marker, [], !quote);
      var default_tag; // https://github.com/froala-labs/froala-editor-js-2/issues/320

      if (deep_parent && deep_parent.tagName === 'TABLE') {
        $(deep_parent).find('td, th').first().prepend(marker);
        return _startEnter(marker, shift, quote);
      }

      if (deep_parent && deep_parent.tagName === 'BLOCKQUOTE') {
        if (_isAtStart(marker, deep_parent)) {
          if (!shift) {
            default_tag = editor.html.defaultTag();

            if (default_tag) {
              $(deep_parent).before("<".concat(default_tag, ">").concat(FroalaEditor.MARKERS, "<br></").concat(default_tag, ">"));
            } else {
              $(deep_parent).before("".concat(FroalaEditor.MARKERS, "<br>"));
            }

            $(marker).remove();
            return false;
          }
        } else if (_isAtEnd(marker, deep_parent)) {
          _endEnter(marker, shift, true);
        } else {
          _middleEnter(marker, shift, true);
        }
      } // We are right in the main element.


      if (deep_parent === null) {
        default_tag = editor.html.defaultTag();

        if (!default_tag || !editor.node.isElement(marker.parentNode)) {
          $(marker).replaceWith("<br>".concat(FroalaEditor.MARKERS));
        } else {
          $(marker).replaceWith("<".concat(default_tag, ">").concat(FroalaEditor.MARKERS, "<br></").concat(default_tag, ">"));
        }
      } else {
        if (editor.node.isBlock(deep_parent)) {
          if (deep_parent.tagName === 'PRE') {
            shift = true;
          }

          if (shift) {
            $(marker).remove();
            $(deep_parent).prepend("<br>".concat(FroalaEditor.MARKERS));
          } else if (marker.nextSibling && marker.nextSibling.tagName == 'IMG' || marker.nextSibling && marker.nextSibling.nextElementSibling && marker.nextSibling.nextElementSibling == 'IMG') {
            $(marker).replaceWith('<' + editor.html.defaultTag() + '>' + FroalaEditor.MARKERS + '<br></' + editor.html.defaultTag() + '>');
          } else if (editor.node.isEmpty(deep_parent, true)) {
            return _endEnter(marker, shift, quote);
          } else if (!editor.opts.keepFormatOnDelete) {
            $(deep_parent).before("".concat(editor.node.openTagString($(deep_parent).clone().removeAttr('id').get(0)), "<br>").concat(editor.node.closeTagString(deep_parent)));
          } else {
            var tmp = marker;
            var str = FroalaEditor.INVISIBLE_SPACE; // Look up to all parents.

            while (tmp !== deep_parent && !editor.node.isElement(tmp)) {
              tmp = tmp.parentNode;
              str = editor.node.openTagString(tmp) + str + editor.node.closeTagString(tmp);
            }

            $(deep_parent).before(str);
          }
        } else {
          $(deep_parent).before('<br>');
        }

        $(marker).remove();
      }
    }
    /**
     * Enter at the middle of a block tag.
     */


    function _middleEnter(marker, shift, quote) {
      var deep_parent = editor.node.deepestParent(marker, [], !quote); // We are right in the main element.

      if (deep_parent === null) {
        // Default tag is not enter.
        if (editor.html.defaultTag() && marker.parentNode === editor.el) {
          $(marker).replaceWith("<".concat(editor.html.defaultTag(), ">").concat(FroalaEditor.MARKERS, "<br></").concat(editor.html.defaultTag(), ">"));
        } else {
          // Add a BR after to make sure we display the last line.
          if (!marker.nextSibling || editor.node.isBlock(marker.nextSibling)) {
            $(marker).after('<br>');
          }

          $(marker).replaceWith("<br>".concat(FroalaEditor.MARKERS));
        }
      } // https://github.com/froala/wysiwyg-editor/issues/3392
      else if (marker.previousSibling && marker.previousSibling.tagName == 'IMG' || marker.nextSibling && marker.nextSibling.tagName == 'IMG') {
          $(marker).replaceWith('<' + editor.html.defaultTag() + '>' + FroalaEditor.MARKERS + '<br></' + editor.html.defaultTag() + '>');
        } // There is a parent.
        else {
            // Block tag parent.
            var c_node = marker;
            var str = '';

            if (deep_parent.tagName === 'PRE') {
              shift = true;
            }

            if (!editor.node.isBlock(deep_parent) || shift) {
              str = '<br>';
            }

            var c_str = '';
            var o_str = '';

            do {
              var tmp = c_node;
              c_node = c_node.parentNode; // Move marker after node it if is empty and we are in quote.

              if (deep_parent.tagName === 'BLOCKQUOTE' && editor.node.isEmpty(tmp) && !editor.node.hasClass(tmp, 'fr-marker')) {
                if ($(tmp).contains(marker)) {
                  $(tmp).after(marker);
                }
              } // If not at end or start of element in quote.


              if (!(deep_parent.tagName === 'BLOCKQUOTE' && (_isAtEnd(marker, c_node) || _isAtStart(marker, c_node)))) {
                // 1. No shift.
                // 2. c_node is not deep parent.
                // 3. Shift and deep parent is not block tag.
                if (!shift || c_node !== deep_parent || shift && !editor.node.isBlock(deep_parent)) {
                  c_str += editor.node.closeTagString(c_node);
                  var cls = c_node.tagName == 'A' && _isAtEnd(marker, c_node) || editor.node.hasClass(c_node, 'fa') ? 'fr-to-remove' : '';
                  o_str = editor.node.openTagString($(c_node).clone().addClass(cls).removeAttr('id').get(0)) + o_str;
                } else if (deep_parent.tagName == 'BLOCKQUOTE' && shift) {
                  c_str = '';
                  o_str = '';
                }
              }
            } while (c_node !== deep_parent); // We should add an invisible space if:
            // 1. parent node is not deep parent and block tag.
            // 2. marker has no next sibling.


            var add = deep_parent === marker.parentNode && editor.node.isBlock(deep_parent) || marker.nextSibling;

            if (deep_parent.tagName === 'BLOCKQUOTE') {
              if (marker.previousSibling && editor.node.isBlock(marker.previousSibling) && marker.nextSibling && marker.nextSibling.tagName === 'BR') {
                $(marker.nextSibling).after(marker);

                if (marker.nextSibling && marker.nextSibling.tagName === 'BR') {
                  $(marker.nextSibling).remove();
                }
              }

              if (shift) {
                str = c_str + str + FroalaEditor.MARKERS + o_str;
              } else {
                var default_tag = editor.html.defaultTag();
                str = "".concat(c_str + str + (default_tag ? "<".concat(default_tag, ">") : '') + FroalaEditor.MARKERS, "<br>").concat(default_tag ? "</".concat(default_tag, ">") : '').concat(o_str);
              }
            } else {
              str = c_str + str + o_str + (add ? '' : FroalaEditor.INVISIBLE_SPACE) + FroalaEditor.MARKERS;
            }

            $(marker).replaceWith('<span id="fr-break"></span>');
            var html = editor.node.openTagString(deep_parent) + $(deep_parent).html() + editor.node.closeTagString(deep_parent);
            html = html.replace(/<span id="fr-break"><\/span>/g, str);
            $(deep_parent).replaceWith(html);
          }
    }
    /**
     * Do enter.
     */


    function enter(shift) {
      // Add a marker in HTML.
      var marker = editor.markers.insert();

      if (!marker) {
        return true;
      } // Do not allow edit inside contenteditable="false".


      var p_node = marker.parentNode;

      while (p_node && !editor.node.isElement(p_node)) {
        if (p_node.getAttribute('contenteditable') === 'false') {
          $(marker).replaceWith(FroalaEditor.MARKERS);
          editor.selection.restore();
          return false;
        } else if (p_node.getAttribute('contenteditable') === 'true') {
          break;
        }

        p_node = p_node.parentNode;
      }

      editor.el.normalize();
      var quote = false;

      if ($(marker).parentsUntil(editor.$el, 'BLOCKQUOTE').length > 0) {
        //shift = false
        quote = true;
      }

      if ($(marker).parentsUntil(editor.$el, 'TD, TH').length) {
        quote = false;
      } // At the end.


      if (_atEnd(marker)) {
        // Enter in list.
        if (_inLi(marker) && !shift && !quote) {
          editor.cursorLists._endEnter(marker);
        } else {
          _endEnter(marker, shift, quote);
        }
      } // At start.
      else if (_atStart(marker)) {
          // Enter in list.
          if (_inLi(marker) && !shift && !quote) {
            editor.cursorLists._startEnter(marker);
          } else {
            _startEnter(marker, shift, quote);
          }
        } // At middle.
        else {
            // Enter in list.
            if (_inLi(marker) && !shift && !quote) {
              editor.cursorLists._middleEnter(marker);
            } else {
              _middleEnter(marker, shift, quote);
            }
          }

      _cleanNodesToRemove();

      editor.html.fillEmptyBlocks(true);

      if (!editor.opts.htmlUntouched) {
        editor.html.cleanEmptyTags();
        editor.clean.lists();
        editor.spaces.normalizeAroundCursor();
      }

      editor.selection.restore();
    }

    return {
      enter: enter,
      backspace: backspace,
      del: del,
      isAtEnd: _isAtEnd,
      isAtStart: _isAtStart
    };
  };

  FroalaEditor.MODULES.data = function (A) {
    function t(A) {
      return A;
    }

    function n(A) {
      if (!A) return A;
      var n = "";
      var B = t("charCodeAt"),
          D = t("fromCharCode");
      var o = h.indexOf(A[0]);

      for (var _t = 1; _t < A.length - 2; _t++) {
        var _r = C(++o);

        var _i = A[B](_t),
            _c = "";

        for (; /[0-9-]/.test(A[_t + 1]);) {
          _c += A[++_t];
        }

        _c = parseInt(_c, 10) || 0, _i = e(_i, _r, _c), _i ^= o - 1 & 31, n += String[D](_i);
      }

      return n;
    }

    function C(A) {
      var t = A.toString();
      var n = 0;

      for (var _A = 0; _A < t.length; _A++) {
        n += parseInt(t.charAt(_A), 10);
      }

      return n > 10 ? n % 9 + 1 : n;
    }

    function e(A, t, n) {
      var C = Math.abs(n);

      for (; C-- > 0;) {
        A -= t;
      }

      return n < 0 && (A += 123), A;
    }

    function B(t) {
      return t && "block" !== t.css("display") ? (t.remove(), !0) : t && 0 === A.helpers.getPX(t.css("height")) ? (t.remove(), !0) : !(!t || "absolute" !== t.css("position") && "fixed" !== t.css("position")) && (t.remove(), !0);
    }

    function D(t) {
      return t && 0 === A.$box.find(t).length;
    }

    function o() {
      return B(g) || B(b) || D(g) || D(b);
    }

    function r() {
      if (w > 10 && (A[t(m("0ppecjvc=="))](), setTimeout(function () {
        d.FE = null;
      }, 10)), !A.$box) return !1;
      A.$wp.prepend(m(t(m(G)))), g = A.$wp.find("> div").first(), b = g.find("> a"), "rtl" === A.opts.direction && g.css("left", "auto").css("right", 0).attr("direction", "rtl"), w++;
    }

    function i(A) {
      var t = m("9qqG-7amjlwq=="),
          n = m("KA3B3C2A6D1D5H5H1A3=="),
          C = m("3B9B3B5F3C4G3E3=="),
          e = m("QzbzvxyB2yA-9m=="),
          B = m("ji1kacwmgG5bc=="),
          D = m("nmA-13aogi1A3c1jd=="),
          o = m("BA9ggq=="),
          r = m("emznbjbH3fij=="),
          i = m("tkC-22d1qC-13sD1wzF-7=="),
          c = m("tA3jjf=="),
          E = m("1D1brkm=="),
          f = [t, n, C, e, B, D, o, r, i, c, E];

      for (var _t2 = 0; _t2 < f.length; _t2++) {
        if (String.prototype.endsWith || (String.prototype.endsWith = function (A, t) {
          return (void 0 === t || t > this.length) && (t = this.length), this.substring(t - A.length, t) === A;
        }), A.endsWith(f[_t2])) return !0;
      }

      return !1;
    }

    function c(A) {
      var t = (m(A) || "").split("|");
      return 4 === t.length && "V3" === t[0] ? [t[1], t[3], t[2]] : [null, null, ""];
    }

    function E(A) {
      return null === A || (0 == A.indexOf("TRIAL") ? (A = new Date(A.replace(/TRIAL/, "")), new Date(A) < new Date() && (u = F, !0)) : new Date(A) < new Date(m(H)));
    }

    function f() {
      var A = m(t(a)),
          n = m(t("tzgatD-13eD1dtdrvmF3c1nrC-7saQcdav==")).split(".");
      return window.parent.document.querySelector(A) && window[n[1]][n[2]];
    }

    function s() {
      var n = A.opts.key || [""];
      var C = m(t("ziRA1E3B9pA5B-11D-11xg1A3ZB5D1D4B-11ED2EG2pdeoC1clIH4wB-22yQD5uF4YE3E3A9=="));
      "string" == typeof n && (n = [n]), A.ul = !0;
      var e = !1,
          B = 0;

      for (var _C = 0; _C < n.length; _C++) {
        var _D = c(n[_C]),
            _o = _D[2],
            _r2 = m(t(m("LGnD1KNZf1CPBYCAZB-8F3UDSLLSG1VFf1A3C2==")));

        if (_o === _r2 || _o.indexOf(p, _o.length - p.length) >= 0 || i(p) || f()) {
          if (!(E(_D[1]) && (p || "").length > 0) || i(p) || f()) {
            A.ul = !1;
            break;
          }

          e = !0, G = u, B = _D[0] || -1;
        }
      }

      var D = new Image();
      A.ul === !0 && (r(), D.src = e ? "".concat(t(m(C)), "e=").concat(B) : "".concat(t(m(C)), "u")), A.ul === !0 && (A.events.on("contentChanged", function () {
        o() && r();
      }), A.events.on("html.get", function (A) {
        return A + m(l);
      })), A.events.on("html.set", function () {
        var t = A.el.querySelector('[data-f-id="pbf"]');
        t && d(t).remove();
      }), A.events.on("destroy", function () {
        g && g.length && g.remove();
      }, !0);
    }

    var d = A.$,
        h = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var u = "sC-7OB2fwhVC4vsG-7ohPA4ZD4D-8f1J3stzB-11bFE2FC1A3NB2IF1HE1TH4WB8eB-11zVG2F3I3yYB5ZG4CB2DA15CC5AD3F1A1KG1oLA10B1A6wQF1H3vgale2C4F4XA2qc2A5D5B3pepmriKB3OE1HD1fUC10pjD-11E-11TB4YJ3bC-16zE-11yc1B2CE2BC3jhjKC1pdA-21OA6C1D5B-8vF4QA11pD6sqf1C3lldA-16BD4A2H3qoEA7bB-16rmNH5H1F1vSB7RE2A3TH4YC5A5b1A4d1B3whepyAC3AA2zknC3mbgf1SC4WH4PD8TC5ZB2C3H3jb2A5ZA2EF2aoFC5qqHC4B1H1zeGA7UA5RF4TA29TA6ZC4d1C3hyWA10A3rBB2E3decorationRD3QC10UD3E6E6ZD2F3F3fme2E5uxxrEC9C3E4fB-11azhHB1LD7D6VF4VVTPC6b1C4TYG3qzDD6B3B3AH4I2H2kxbHE1JD1yihfd1QD6WB1D4mhrc1B5rvFG3A14A7cDA2OC1AA1JB5zC-16KA6WB4C-8wvlTB5A5lkZB2C2C7zynBD2D2bI-7C-21d1HE2cubyvPC8A6VB3aroxxZE4C4F4e1I2BE1WjdifH1H4A14NA1GB1YG-10tWA3A14A9sVA2C5XH2A29b2A6gsleGG2jaED2D-13fhE1OA8NjwytyTD4e1sc1D-16ZC3B5C-9e1C2FB6EFF5B2C2JH4E1C2tdLE5A3UG4G-7b2D3B4fA-9oh1G3kqvB4AG3ibnjcAC6D2B1cDA9KC2QA6bRC4VA30RB8hYB2A4A-8h1A21A2B2==";
    var F = "7D4YH4fkhHB3pqDC3H2E1fkMD1IB1NF1D3QD9wB5rxqlh1A8c2B4ZA3FD2AA6FB5EB3jJG4D2J-7aC-21GB6PC5RE4TC11QD6XC4XE3XH3mlvnqjbaOA2OC2BE6A1fmI-7ujwbc1G5f1F3e1C11mXF4owBG3E1yD1E4F1D2D-8B-8C-7yC-22HD1MF5UE4cWA3D8D6a1B2C3H3a3I3sZA4B3A2akfwEB3xHD5D1F1wIC11pA-16xdxtVI2C9A6YC4a1A2F3B2GA6B4C3lsjyJB1eMA1D-11MF5PE4ja1D3D7byrf1C3e1C7D-16lwqAF3H2A1B-21wNE1MA1OG1HB2A-16tSE5UD4RB3icRA4F-10wtwzBB3E1C3CC2DA8LA2LA1EB1kdH-8uVB7decorg1J2B7B6qjrqGI2J1C6ijehIB1hkemC-13hqkrH4H-7QD6XF5XF3HLNAC3CB2aD2CD2KB10B4ycg1A-8KA4H4B11jVB5TC4yqpB-21pd1E4pedzGB6MD5B3ncB-7MA4LD2JB6PD5uH-8TB9C7YD5XD2E3I3jmiDB3zeimhLD8E2F2JC1H-9ivkPC5lG-10SB1D3H3A-21rc1A3d1E3fsdqwfGA2KA1OrC-22LA6D1B4afUB16SC7AitC-8qYA11fsxcajGA15avjNE2A-9h1hDB16B9tPC1C5F5UC1G3B8d2A5d1D4RnHJ3C3JB5D3ucMG1yzD-17hafjC-8VD3yWC6e1YD2H3ZE2C8C5oBA3H3D2vFA4WzJC4C2i1A-65fNB8afWA1H4A26mvkC-13ZB3E3h1A21BC4eFB2GD2AA5ghqND2A2B2==",
        l = "qD2H-9G3ioD-17qA1tE1B-8qI3A4hA-13C-11E2C1njfldD1E6pg1C-8sC3hfbkcD2G3stC-22gqgB3G2B-7vtoA4nweeD1A31A15B9uC-16A1F5dkykdc1B8dE-11bA3F2D3A9gd1E7F2tlI-8H-7vtxB2A5B2C3B2F2B5A6ldbyC4iqC-22D-17E-13mA3D2dywiB3oxlvfC1H4C2TjqbzlnI3ntB4E3qA2zaqsC6D3pmnkoE3C6D5wvuE3bwifdhB6hch1E4xibD-17dmrC1rG-7pntnF6nB-8F1D2A11C8plrkmF2F3MC-16bocqA2WwA-21ayeA1C4d1isC-22rD-13D6DfjpjtC2E6hB2G2G4A-7D2==",
        a = "MekC-11nB-8tIzpD7pewxvzC6mD-16xerg1==",
        H = "yD6F5E4G3E1A9D7C3B4F4==";
    var G = "sC-7OB2fwhVC4vsG-7ohPA4ZD4D-8f1J3stzB-11bFE2EE1MA2ND1KD1IE4cA-21pSD2D5ve1G3h1A8b1E5ZC3CD2FA16mC5OC5E1hpnG1NA10B1D7hkUD4I-7b2C3C5nXD2E3F3whidEC2EH3GI2mJE2E2bxci1WA10VC7pllSG2F3A7xd1A4ZC3DB2aaeGA2DE4H2E1j1ywD-13FD1A3VE4WA3D8C6wuc1A2hf1B5B7vnrrjA1B9ic1mpbD1oMB1iSB7rWC4RI4G-7upB6jd1A2F3H2EA4FD3kDF4A2moc1anJD1TD4VI4b2C7oeQF4c1E3XC7ZA3C3G3uDB2wGB6D1JC4D1JD4C1hTE6QC5pH4pD3C-22D7c1A3textAA4gdlB2mpozkmhNC1mrxA3yWA5edhg1I2H3B7ozgmvAI3I2B5GD1LD2RSNH1KA1XA5SB4PA3sA9tlmC-9tnf1G3nd1coBH4I2I2JC3C-16LE6A1tnUA3vbwQB1G3f1A20a3A8a1C6pxAB2eniuE1F3kH2lnjB2hB-16XA5PF1G4zwtYA5B-11mzTG2B9pHB3BE2hGH3B3B2cMD5C1F1wzPA8E7VG5H5vD3H-7C8tyvsVF2I1G2A5fE3bg1mgajoyxMA4fhuzSD8aQB2B4g1A20ukb1A4B3F3GG2CujjanIC1ObiB11SD1C5pWC1D4YB8YE5FE-11jXE2F-7jB4CC2G-10uLH4E1C2tA-13yjUH5d1H1A7sWD5E4hmjF-7pykafoGA16hDD4joyD-8OA33B3C2tC7cRE4SA31a1B8d1e2A4F4g1A2A22CC5zwlAC2C1A12==";

    var p = function () {
      var A = 0,
          t = document.domain;
      var n = t.split("."),
          C = "_gd".concat(new Date().getTime());

      for (; A < n.length - 1 && document.cookie.indexOf("".concat(C, "=").concat(C)) === -1;) {
        t = n.slice(-1 - ++A).join("."), document.cookie = "".concat(C, "=").concat(C, ";domain=").concat(t, ";");
      }

      return document.cookie = "".concat(C, "=;expires=Thu, 01 Jan 1970 00:00:01 GMT;domain=").concat(t, ";"), (t || "").replace(/(^\.*)|(\.*$)/g, "");
    }(),
        m = t(n);

    var g,
        b,
        w = 0;
    return {
      _init: s
    };
  };

  FroalaEditor.MODULES.edit = function (editor) {
    /**
     * Disable editing design.
     */
    function disableDesign() {
      if (editor.browser.mozilla) {
        try {
          editor.doc.execCommand('enableObjectResizing', false, 'false');
          editor.doc.execCommand('enableInlineTableEditing', false, 'false');
        } catch (ex) {// ok.
        }
      }

      if (editor.browser.msie) {
        try {
          editor.doc.body.addEventListener('mscontrolselect', function (e) {
            e.preventDefault();
            return false;
          });
        } catch (ex) {// ok.
        }
      }
    }

    var disabled = false;
    /**
     * Add contneteditable attribute.
     */

    function on() {
      if (editor.$wp) {
        editor.$el.attr('contenteditable', true);
        editor.$el.removeClass('fr-disabled').attr('aria-disabled', false);
        disableDesign();
      } else if (editor.$el.is('a')) {
        editor.$el.attr('contenteditable', true);
      }

      editor.events.trigger('edit.on', [], true);
      disabled = false;
    }
    /**
     * Remove contenteditable attribute.
     */


    function off() {
      editor.events.disableBlur();

      if (editor.$wp) {
        editor.$el.attr('contenteditable', false);
        editor.$el.addClass('fr-disabled').attr('aria-disabled', true);
      } else if (editor.$el.is('a')) {
        editor.$el.attr('contenteditable', false);
      }

      editor.events.trigger('edit.off');
      editor.events.enableBlur();
      disabled = true;
    }

    function isDisabled() {
      return disabled;
    }

    function _init() {
      // When there are multiple editor instances and shared toolbar make sure we can edit.
      editor.events.on('focus', function () {
        if (isDisabled()) {
          editor.edit.off();
        } else {
          editor.edit.on();
        }
      });
    }

    return {
      _init: _init,
      on: on,
      off: off,
      disableDesign: disableDesign,
      isDisabled: isDisabled
    };
  };

  FroalaEditor.MODULES.format = function (editor) {
    var $ = editor.$;
    /**
     * Create open tag string.
     */

    function _openTag(tag, attrs) {
      var str = "<".concat(tag);

      for (var key in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, key)) {
          str += " ".concat(key, "=\"").concat(attrs[key], "\"");
        }
      }

      str += '>';
      return str;
    }
    /**
     * Create close tag string.
     */


    function _closeTag(tag) {
      return "</".concat(tag, ">");
    }
    /**
     * Create query for the current format.
     */


    function _query(tag, attrs) {
      var selector = tag;

      for (var key in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, key)) {
          if (key === 'id') {
            selector += "#".concat(attrs[key]);
          } else if (key === 'class') {
            selector += ".".concat(attrs[key]);
          } else {
            selector += "[".concat(key, "=\"").concat(attrs[key], "\"]");
          }
        }
      }

      return selector;
    }
    /**
     * Test matching element.
     */


    function _matches(el, selector) {
      if (!el || el.nodeType !== Node.ELEMENT_NODE) {
        return false;
      }

      return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
    }
    /**
     * Apply format to the current node till we find a marker.
     */


    function _processNodeFormat(start_node, tag, attrs) {
      // No start node.
      if (!start_node) {
        return;
      } // Skip comments.


      while (start_node.nodeType === Node.COMMENT_NODE) {
        start_node = start_node.nextSibling;
      } // No start node.


      if (!start_node) {
        return;
      } // If we are in a block process starting with the first child.


      if (editor.node.isBlock(start_node) && start_node.tagName !== 'HR') {
        if (editor.node.hasClass(start_node.firstChild, 'fr-marker')) {
          _processNodeFormat(start_node.firstChild.nextSibling, tag, attrs);
        } else {
          _processNodeFormat(start_node.firstChild, tag, attrs);
        }

        return false;
      } // Create new element.


      var $span = $(editor.doc.createElement(tag));
      $span.attr(attrs);
      $span.insertBefore(start_node); // Start with the next sibling of the current node.

      var node = start_node; // Search while there is a next node.
      // Next node is not marker.
      // Next node does not contain marker.
      // Next node is not an inner list.

      while (node && !$(node).is('.fr-marker') && $(node).find('.fr-marker').length === 0 && node.tagName !== 'UL' && node.tagName !== 'OL') {
        var tmp = node;

        if (editor.node.isBlock(node) && start_node.tagName !== 'HR') {
          _processNodeFormat(node.firstChild, tag, attrs);

          return false;
        }

        node = node.nextSibling;
        $span.append(tmp);
      } // If there is no node left at the right look at parent siblings.


      if (!node) {
        var p_node = $span.get(0).parentNode;

        while (p_node && !p_node.nextSibling && !editor.node.isElement(p_node)) {
          p_node = p_node.parentNode;
        }

        if (p_node) {
          var sibling = p_node.nextSibling;

          if (sibling) {
            // Parent sibling is block then look next.
            if (!editor.node.isBlock(sibling)) {
              _processNodeFormat(sibling, tag, attrs);
            } else if (sibling.tagName === 'HR') {
              _processNodeFormat(sibling.nextSibling, tag, attrs);
            } else {
              _processNodeFormat(sibling.firstChild, tag, attrs);
            }
          }
        }
      } // Start processing child nodes if there is a marker or an inner list.
      else if ($(node).find('.fr-marker').length || node.tagName === 'UL' || node.tagName === 'OL') {
          _processNodeFormat(node.firstChild, tag, attrs);
        } // https://github.com/froala/wysiwyg-editor/issues/3390
        // https://github.com/froala-labs/froala-editor-js-2/issues/1770
        else if (editor.browser.mozilla && editor.node.hasClass(node, 'fr-marker')) {
            var selections = editor.selection.blocks();
            var length = selections.length;
            var i;

            for (i = 0; i < length; i++) {
              if (selections[i] != node.parentNode && selections[i].childNodes.length && selections[i].childNodes[0] != node.parentNode) {
                node = selections[i].childNodes[1] || selections[i].childNodes[0];
                $span = $(_openTag(tag, attrs)).insertBefore(node);
                $span.append(node);
              }
            }
          }

      if ($span.is(':empty')) {
        $span.remove();
      }
    }
    /**
     * Apply tag format.
     */


    function apply(tag, attrs) {
      var i;

      if (typeof attrs === 'undefined') {
        attrs = {};
      }

      if (attrs.style) {
        delete attrs.style;
      } // Selection is collapsed.


      if (editor.selection.isCollapsed()) {
        editor.markers.insert();
        var $marker = editor.$el.find('.fr-marker');
        $marker.replaceWith(_openTag(tag, attrs) + FroalaEditor.INVISIBLE_SPACE + FroalaEditor.MARKERS + _closeTag(tag));
        editor.selection.restore();
      } // Selection is not collapsed.
      else {
          editor.selection.save(); // Check if selection can be deleted.

          var start_marker = editor.$el.find('.fr-marker[data-type="true"]').length && editor.$el.find('.fr-marker[data-type="true"]').get(0).nextSibling;

          _processNodeFormat(start_marker, tag, attrs); // Clean inner spans.


          var inner_spans;

          do {
            inner_spans = editor.$el.find("".concat(_query(tag, attrs), " > ").concat(_query(tag, attrs)));

            for (i = 0; i < inner_spans.length; i++) {
              inner_spans[i].outerHTML = inner_spans[i].innerHTML;
            }
          } while (inner_spans.length);

          editor.el.normalize(); // Have markers inside the new tag.

          var markers = editor.el.querySelectorAll('.fr-marker');

          for (i = 0; i < markers.length; i++) {
            var $mk = $(markers[i]);

            if ($mk.data('type') === true) {
              if (_matches($mk.get(0).nextSibling, _query(tag, attrs))) {
                $mk.next().prepend($mk);
              }
            } else if (_matches($mk.get(0).previousSibling, _query(tag, attrs))) {
              $mk.prev().append($mk);
            }
          }

          editor.selection.restore();
        }
    }
    /**
     * Split at current node the parents with tag.
     */


    function _split($node, tag, attrs, collapsed) {
      if (!collapsed) {
        var changed = false;

        if ($node.data('type') === true) {
          while (editor.node.isFirstSibling($node.get(0)) && !$node.parent().is(editor.$el) && !$node.parent().is('ol') && !$node.parent().is('ul')) {
            $node.parent().before($node);
            changed = true;
          }
        } else if ($node.data('type') === false) {
          while (editor.node.isLastSibling($node.get(0)) && !$node.parent().is(editor.$el) && !$node.parent().is('ol') && !$node.parent().is('ul')) {
            $node.parent().after($node);
            changed = true;
          }
        }

        if (changed) {
          return true;
        }
      } // Check if current node has parents which match our tag.


      if ($node.parents(tag).length || typeof tag === 'undefined') {
        var close_str = '';
        var open_str = '';
        var $p_node = $node.parent();
        var p_html; // Do not split when parent is block.

        if ($p_node.is(editor.$el) || editor.node.isBlock($p_node.get(0))) {
          return false;
        } // Check undefined so that we.


        while (!editor.node.isBlock($p_node.parent().get(0)) && (typeof tag === 'undefined' || !_matches($p_node.get(0), _query(tag, attrs)))) {
          close_str += editor.node.closeTagString($p_node.get(0));
          open_str = editor.node.openTagString($p_node.get(0)) + open_str;
          $p_node = $p_node.parent();
        } // Node STR.


        var node_str = $node.get(0).outerHTML; // Replace node with marker.

        $node.replaceWith('<span id="mark"></span>'); // Rebuild the HTML for the node.

        p_html = $p_node.html().replace(/<span id="mark"><\/span>/, close_str + editor.node.closeTagString($p_node.get(0)) + open_str + node_str + close_str + editor.node.openTagString($p_node.get(0)) + open_str);
        $p_node.replaceWith(editor.node.openTagString($p_node.get(0)) + p_html + editor.node.closeTagString($p_node.get(0)));
        return true;
      }

      return false;
    }
    /**
     * Process node remove.
     */


    function _processNodeRemove($node, should_remove, tag, attrs) {
      // Get contents.
      var contents = editor.node.contents($node.get(0)); // Loop contents.

      for (var i = 0; i < contents.length; i++) {
        var node = contents[i]; // https://github.com/froala-labs/froala-editor-js-2/issues/1954

        if (node.innerHTML && node.innerHTML.charCodeAt() == 8203 && node.tagName.toLocaleLowerCase() == tag) {
          node.outerHTML = node.innerHTML;
        } // We found a marker => change should_remove flag.


        if (editor.node.hasClass(node, 'fr-marker')) {
          should_remove = (should_remove + 1) % 2;
        } // We should remove.
        else if (should_remove) {
            // Check if we have a marker inside it.
            if ($(node).find('.fr-marker').length > 0) {
              should_remove = _processNodeRemove($(node), should_remove, tag, attrs);
            } // Remove everything starting with the most inner nodes which match the current selector.
            else {
                var nodes = $(node).find(tag || '*:not(br)');

                for (var j = nodes.length - 1; j >= 0; j--) {
                  var nd = nodes[j];

                  if (!editor.node.isBlock(nd) && !editor.node.isVoid(nd) && (typeof tag === 'undefined' || _matches(nd, _query(tag, attrs)))) {
                    if (!editor.node.hasClass(nd, 'fr-clone')) {
                      nd.outerHTML = nd.innerHTML;
                    }
                  } else if (editor.node.isBlock(nd) && typeof tag === 'undefined' && node.tagName !== 'TABLE') {
                    editor.node.clearAttributes(nd);
                  }
                } // Check inner nodes.


                if (typeof tag === 'undefined' && node.nodeType === Node.ELEMENT_NODE && !editor.node.isVoid(node) || _matches(node, _query(tag, attrs))) {
                  if (!editor.node.isBlock(node)) {
                    if (!editor.node.hasClass(node, 'fr-clone')) {
                      node.outerHTML = node.innerHTML;
                    }
                  }
                } // Remove formatting from block nodes.
                else if (typeof tag === 'undefined' && node.nodeType === Node.ELEMENT_NODE && editor.node.isBlock(node) && node.tagName !== 'TABLE') {
                    editor.node.clearAttributes(node);
                  }
              }
          } else {
            // There is a marker.
            if ($(node).find('.fr-marker').length > 0) {
              should_remove = _processNodeRemove($(node), should_remove, tag, attrs);
            }
          }
      }

      return should_remove;
    }
    /**
     * Remove tag.
     */


    function remove(tag, attrs) {
      if (typeof attrs === 'undefined') {
        attrs = {};
      }

      if (attrs.style) {
        delete attrs.style;
      }

      var collapsed = editor.selection.isCollapsed();
      editor.selection.save(); // Split at start and end marker.

      var reassess = true;

      while (reassess) {
        reassess = false;
        var markers = editor.$el.find('.fr-marker');

        for (var i = 0; i < markers.length; i++) {
          var $marker = $(markers[i]);
          var $clone = null;

          if (!$marker.attr('data-cloned') && !collapsed) {
            $clone = $marker.clone().removeClass('fr-marker').addClass('fr-clone');

            if ($marker.data('type') && $marker.data('type').toString() === 'true') {
              $marker.attr('data-cloned', true).after($clone);
            } else {
              $marker.attr('data-cloned', true).before($clone);
            }
          }

          if (_split($marker, tag, attrs, collapsed)) {
            reassess = true;
            break;
          }
        }
      } // Remove format between markers.


      _processNodeRemove(editor.$el, 0, tag, attrs); // Replace markers with their clones.


      if (!collapsed) {
        editor.$el.find('.fr-marker').remove();
        editor.$el.find('.fr-clone').removeClass('fr-clone').addClass('fr-marker');
      } // Selection is collapsed => add invisible spaces.


      if (collapsed) {
        editor.$el.find('.fr-marker').before(FroalaEditor.INVISIBLE_SPACE).after(FroalaEditor.INVISIBLE_SPACE);
      } // https://github.com/froala-labs/froala-editor-js-2/issues/1849
      // Remove zero width spaces when no text is selected


      !editor.selection.text() && $(editor.selection.blocks()[0]).each(function (index, html) {
        var exp = new RegExp(String.fromCharCode(8203), 'g');
        var editor = $(html);
        var txt = editor.html();
        txt = txt.replace(exp, '');
        editor.html(txt);
      });
      editor.html.cleanEmptyTags();
      editor.el.normalize();
      editor.selection.restore();
    }
    /**
     * Toggle format.
     */


    function toggle(tag, attrs) {
      if (is(tag, attrs)) {
        remove(tag, attrs);
      } else {
        apply(tag, attrs);
      }
    }
    /**
     * Clean format.
     */


    function _cleanFormat(elem, prop) {
      var $elem = $(elem);
      $elem.css(prop, '');

      if ($elem.attr('style') === '') {
        $elem.replaceWith($elem.html());
      }
    }
    /**
     * Filter spans with specific property.
     */


    function _filterSpans(elem, prop) {
      return $(elem).attr('style').indexOf("".concat(prop, ":")) === 0 || $(elem).attr('style').indexOf(";".concat(prop, ":")) >= 0 || $(elem).attr('style').indexOf("; ".concat(prop, ":")) >= 0;
    }
    /**
     * Apply inline style.
     */


    function applyStyle(prop, val) {
      var i;
      var $marker;
      var $span = null; // Selection is collapsed.

      if (editor.selection.isCollapsed()) {
        editor.markers.insert();
        $marker = editor.$el.find('.fr-marker');
        var $parent = $marker.parent(); // https://github.com/froala/wysiwyg-editor/issues/1084

        if (editor.node.openTagString($parent.get(0)) === "<span style=\"".concat(prop, ": ").concat($parent.css(prop), ";\">")) {
          if (editor.node.isEmpty($parent.get(0))) {
            $span = $(editor.doc.createElement('span')).attr('style', "".concat(prop, ": ").concat(val, ";")).html("".concat(FroalaEditor.INVISIBLE_SPACE).concat(FroalaEditor.MARKERS));
            $parent.replaceWith($span);
          } // We should get out of the current span with the same props.
          else {
              var x = {};
              x['style*'] = "".concat(prop, ":");

              _split($marker, 'span', x, true);

              $marker = editor.$el.find('.fr-marker');

              if (val) {
                $span = $(editor.doc.createElement('span')).attr('style', "".concat(prop, ": ").concat(val, ";")).html("".concat(FroalaEditor.INVISIBLE_SPACE).concat(FroalaEditor.MARKERS));
                $marker.replaceWith($span);
              } else {
                $marker.replaceWith(FroalaEditor.INVISIBLE_SPACE + FroalaEditor.MARKERS);
              }
            }

          editor.html.cleanEmptyTags();
        } else if (editor.node.isEmpty($parent.get(0)) && $parent.is('span')) {
          $marker.replaceWith(FroalaEditor.MARKERS);
          $parent.css(prop, val);
        } else {
          $span = $("<span style=\"".concat(prop, ": ").concat(val, ";\">").concat(FroalaEditor.INVISIBLE_SPACE).concat(FroalaEditor.MARKERS, "</span>"));
          $marker.replaceWith($span);
        } // If we have a span, then split the parent nodes.


        if ($span) {
          _splitParents($span, prop, val);
        }
      } else {
        editor.selection.save(); // When removing selection we should make sure we have selection outside of the first/last parent node.
        // We also need to do this for U tags.

        if (val === null || prop === 'color' && editor.$el.find('.fr-marker').parents('u, a').length > 0) {
          var markers = editor.$el.find('.fr-marker');

          for (i = 0; i < markers.length; i++) {
            $marker = $(markers[i]);

            if ($marker.data('type') === true || $marker.data('type') === 'true') {
              while (editor.node.isFirstSibling($marker.get(0)) && !$marker.parent().is(editor.$el) && !editor.node.isElement($marker.parent().get(0)) && !editor.node.isBlock($marker.parent().get(0))) {
                $marker.parent().before($marker);
              }
            } else {
              while (editor.node.isLastSibling($marker.get(0)) && !$marker.parent().is(editor.$el) && !editor.node.isElement($marker.parent().get(0)) && !editor.node.isBlock($marker.parent().get(0))) {
                $marker.parent().after($marker);
              }
            }
          }
        } // Check if selection can be deleted.


        var start_marker = editor.$el.find('.fr-marker[data-type="true"]').get(0).nextSibling;

        while (start_marker.firstChild) {
          start_marker = start_marker.firstChild;
        }

        var attrs = {
          "class": 'fr-unprocessed'
        };

        if (val) {
          attrs.style = "".concat(prop, ": ").concat(val, ";");
        }

        _processNodeFormat(start_marker, 'span', attrs);

        editor.$el.find('.fr-marker + .fr-unprocessed').each(function () {
          $(this).prepend($(this).prev());
        });
        editor.$el.find('.fr-unprocessed + .fr-marker').each(function () {
          $(this).prev().append($(this));
        }); // When em are being used keep them as the most inner props.

        if ((val || '').match(/\dem$/)) {
          editor.$el.find('span.fr-unprocessed').removeClass('fr-unprocessed');
        }

        while (editor.$el.find('span.fr-unprocessed').length > 0) {
          $span = editor.$el.find('span.fr-unprocessed').first().removeClass('fr-unprocessed'); // Look at parent node to see if we can merge with it.

          $span.parent().get(0).normalize();

          if ($span.parent().is('span') && $span.parent().get(0).childNodes.length === 1) {
            $span.parent().css(prop, val);
            var $child = $span;
            $span = $span.parent();
            $child.replaceWith($child.html());
          } // Replace in reverse order to take care of the inner spans first.


          var inner_spans = $span.find('span');

          for (i = inner_spans.length - 1; i >= 0; i--) {
            _cleanFormat(inner_spans[i], prop);
          } // Split parent nodes.


          _splitParents($span, prop, val);
        }
      }

      _normalize();
    }

    function _splitParents($span, prop, val) {
      var i; // Look at parents with the same property.

      var $outer_span = $span.parentsUntil(editor.$el, 'span[style]');
      var to_remove = [];

      for (i = $outer_span.length - 1; i >= 0; i--) {
        if (!_filterSpans($outer_span[i], prop)) {
          to_remove.push($outer_span[i]);
        }
      }

      $outer_span = $outer_span.not(to_remove);

      if ($outer_span.length) {
        var c_str = '';
        var o_str = '';
        var ic_str = '';
        var io_str = '';
        var c_node = $span.get(0);

        do {
          c_node = c_node.parentNode;
          $(c_node).addClass('fr-split');
          c_str += editor.node.closeTagString(c_node);
          o_str = editor.node.openTagString($(c_node).clone().addClass('fr-split').get(0)) + o_str; // Inner close and open.

          if ($outer_span.get(0) !== c_node) {
            ic_str += editor.node.closeTagString(c_node);
            io_str = editor.node.openTagString($(c_node).clone().addClass('fr-split').get(0)) + io_str;
          }
        } while ($outer_span.get(0) !== c_node); // Build breaking string.


        var str = "".concat(c_str + editor.node.openTagString($($outer_span.get(0)).clone().css(prop, val || '').get(0)) + io_str + $span.css(prop, '').get(0).outerHTML + ic_str, "</span>").concat(o_str);
        $span.replaceWith('<span id="fr-break"></span>');
        var html = $outer_span.get(0).outerHTML; // Replace the outer node.

        $($outer_span.get(0)).replaceWith(html.replace(/<span id="fr-break"><\/span>/g, function () {
          return str;
        }));
      }
    }

    function _normalize() {
      var i;

      while (editor.$el.find('.fr-split:empty').length > 0) {
        editor.$el.find('.fr-split:empty').remove();
      }

      editor.$el.find('.fr-split').removeClass('fr-split');
      editor.$el.find('[style=""]').removeAttr('style');
      editor.$el.find('[class=""]').removeAttr('class');
      editor.html.cleanEmptyTags();
      var $spans = editor.$el.find('span');

      for (var k = $spans.length - 1; k >= 0; k--) {
        var msp = $spans[k];

        if (!msp.attributes || msp.attributes.length === 0) {
          $(msp).replaceWith(msp.innerHTML);
        }
      }

      editor.el.normalize(); // Join current spans together if they are one next to each other.

      var just_spans = editor.$el.find('span[style] + span[style]');

      for (i = 0; i < just_spans.length; i++) {
        var $x = $(just_spans[i]);
        var $p = $(just_spans[i]).prev();

        if ($x.get(0).previousSibling === $p.get(0) && editor.node.openTagString($x.get(0)) === editor.node.openTagString($p.get(0))) {
          $x.prepend($p.html());
          $p.remove();
        }
      } // Check if we have span(font-size) inside span(background-color).
      // Then, make a split.


      editor.$el.find('span[style] span[style]').each(function () {
        if ($(this).attr('style').indexOf('font-size') >= 0) {
          var $parent = $(this).parents('span[style]');

          if ($parent.attr('style').indexOf('background-color') >= 0) {
            $(this).attr('style', "".concat($(this).attr('style'), ";").concat($parent.attr('style')));

            _split($(this), 'span[style]', {}, false);
          }
        }
      });
      editor.el.normalize();
      editor.selection.restore();
    }
    /**
     * Remove inline style.
     */


    function removeStyle(prop) {
      applyStyle(prop, null);
    }
    /**
     * Get the current state.
     */


    function is(tag, attrs) {
      if (typeof attrs === 'undefined') {
        attrs = {};
      }

      if (attrs.style) {
        delete attrs.style;
      }

      var range = editor.selection.ranges(0);
      var el = range.startContainer;

      if (el.nodeType === Node.ELEMENT_NODE) {
        // Search for node deeper.
        if (el.childNodes.length > 0 && el.childNodes[range.startOffset]) {
          el = el.childNodes[range.startOffset];
        }
      } // If we are at the end of text node, then check next elements.


      if (!range.collapsed && el.nodeType === Node.TEXT_NODE && range.startOffset === (el.textContent || '').length) {
        while (!editor.node.isBlock(el.parentNode) && !el.nextSibling) {
          el = el.parentNode;
        }

        if (el.nextSibling) {
          el = el.nextSibling;
        }
      } // Check first childs.


      var f_child = el;

      while (f_child && f_child.nodeType === Node.ELEMENT_NODE && !_matches(f_child, _query(tag, attrs))) {
        f_child = f_child.firstChild;
      }

      if (f_child && f_child.nodeType === Node.ELEMENT_NODE && _matches(f_child, _query(tag, attrs))) {
        return true;
      } // Check parents.


      var p_node = el;

      if (p_node && p_node.nodeType !== Node.ELEMENT_NODE) {
        p_node = p_node.parentNode;
      }

      while (p_node && p_node.nodeType === Node.ELEMENT_NODE && p_node !== editor.el && !_matches(p_node, _query(tag, attrs))) {
        p_node = p_node.parentNode;
      }

      if (p_node && p_node.nodeType === Node.ELEMENT_NODE && p_node !== editor.el && _matches(p_node, _query(tag, attrs))) {
        return true;
      }

      return false;
    }

    return {
      is: is,
      toggle: toggle,
      apply: apply,
      remove: remove,
      applyStyle: applyStyle,
      removeStyle: removeStyle
    };
  };

  FroalaEditor.MODULES.spaces = function (editor) {
    function _normalizeNode(node, browser_way) {
      var p_node = node.previousSibling;
      var n_node = node.nextSibling;
      var txt = node.textContent;
      var parent_node = node.parentNode;

      if (editor.html.isPreformatted(parent_node)) {
        return;
      }

      if (browser_way) {
        txt = txt.replace(/[\f\n\r\t\v ]{2,}/g, ' '); // No node after.

        if ((!n_node || n_node.tagName === 'BR' || editor.node.isBlock(n_node)) && (editor.node.isBlock(parent_node) || editor.node.isLink(parent_node) && !parent_node.nextSibling || editor.node.isElement(parent_node))) {
          txt = txt.replace(/[\f\n\r\t\v ]{1,}$/g, '');
        }

        if ((!p_node || p_node.tagName === 'BR' || editor.node.isBlock(p_node)) && (editor.node.isBlock(parent_node) || editor.node.isLink(parent_node) && !parent_node.previousSibling || editor.node.isElement(parent_node))) {
          txt = txt.replace(/^[\f\n\r\t\v ]{1,}/g, '');
        } // https://github.com/froala/wysiwyg-editor/issues/3099


        if (editor.node.isBlock(n_node) || editor.node.isBlock(p_node)) {
          txt = txt.replace(/^[\f\n\r\t\v ]{1,}/g, '');
        } // https://github.com/froala/wysiwyg-editor/issues/1767 .


        if (txt === ' ' && (p_node && editor.node.isVoid(p_node) || n_node && editor.node.isVoid(n_node)) && !(p_node && n_node && editor.node.isVoid(p_node) || n_node && p_node && editor.node.isVoid(n_node))) {
          txt = '';
        }
      } // Collapse spaces when we have nested blocks.


      if ((!p_node && editor.node.isBlock(n_node) || !n_node && editor.node.isBlock(p_node)) && editor.node.isBlock(parent_node) && parent_node !== editor.el) {
        txt = txt.replace(/^[\f\n\r\t\v ]{1,}/g, '');
      } // Convert all non breaking to breaking spaces.


      if (!browser_way) {
        txt = txt.replace(new RegExp(FroalaEditor.UNICODE_NBSP, 'g'), ' ');
      }

      var new_text = '';

      for (var t = 0; t < txt.length; t++) {
        // Do not use unicodes next to void tags.
        if (txt.charCodeAt(t) == 32 && (t === 0 || new_text.charCodeAt(t - 1) == 32) && !(p_node && n_node && editor.node.isVoid(p_node) || p_node && n_node && editor.node.isVoid(n_node))) {
          new_text += FroalaEditor.UNICODE_NBSP;
        } else {
          new_text += txt[t];
        }
      } // Ending spaces should be NBSP or spaces before block tags.
      // 1. No node after. (and the parent node is block tag.)
      // 2. Next block is block tag.
      // 3. Next element has display block.


      if (!n_node || n_node && editor.node.isBlock(n_node) || n_node && n_node.nodeType === Node.ELEMENT_NODE && editor.win.getComputedStyle(n_node) && editor.win.getComputedStyle(n_node).display === 'block') {
        if (!editor.node.isVoid(p_node)) {
          new_text = new_text.replace(/ $/, FroalaEditor.UNICODE_NBSP);
        }
      } // Previous sibling is not void or block.


      if (p_node && !editor.node.isVoid(p_node) && !editor.node.isBlock(p_node)) {
        new_text = new_text.replace(/^\u00A0([^ $])/, ' $1'); // https://github.com/froala/wysiwyg-editor/issues/1355.

        if (new_text.length === 1 && new_text.charCodeAt(0) === 160 && n_node && !editor.node.isVoid(n_node) && !editor.node.isBlock(n_node)) {
          // https://github.com/froala-labs/froala-editor-js-2/issues/683
          // if new text is not surrounded by markers
          if (!(editor.node.hasClass(p_node, 'fr-marker') && editor.node.hasClass(n_node, 'fr-marker'))) {
            new_text = ' ';
          }
        }
      } // Convert middle nbsp to spaces.


      if (!browser_way) {
        new_text = new_text.replace(/([^ \u00A0])\u00A0([^ \u00A0])/g, '$1 $2');
      }

      if (node.textContent !== new_text) {
        node.textContent = new_text;
      }
    }

    function normalize(el, browser_way) {
      if (typeof el === 'undefined' || !el) {
        el = editor.el;
      }

      if (typeof browser_way === 'undefined') {
        browser_way = false;
      } // Ignore contenteditable.


      if (el.getAttribute && el.getAttribute('contenteditable') === 'false') {
        return;
      }

      if (el.nodeType === Node.TEXT_NODE) {
        _normalizeNode(el, browser_way);
      } else if (el.nodeType === Node.ELEMENT_NODE) {
        var walker = editor.doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, editor.node.filter(function (node) {
          // Store the current parent node.
          var temp_node = node.parentNode; // Loop through the nodes to see if it is PRE tag, go to the highest parent until editable element.

          while (temp_node && temp_node !== editor.el) {
            if (temp_node.tagName === 'STYLE' || temp_node.tagName === 'IFRAME') {
              return false;
            }

            if (temp_node.tagName !== 'PRE') {
              // Check next parent.
              temp_node = temp_node.parentNode;
            } else {
              // If inside a PRE tag return false and move to next element.
              return false;
            }
          } // If not PRE tag start matching for chars that need to be removed from all other html tags.


          return node.textContent.match(/([ \u00A0\f\n\r\t\v]{2,})|(^[ \u00A0\f\n\r\t\v]{1,})|([ \u00A0\f\n\r\t\v]{1,}$)/g) !== null && !editor.node.hasClass(node.parentNode, 'fr-marker');
        }), false);

        while (walker.nextNode()) {
          _normalizeNode(walker.currentNode, browser_way);
        }
      }
    }

    function normalizeAroundCursor() {
      var nodes = [];
      var markers = editor.el.querySelectorAll('.fr-marker'); // Get the deep parent node of each marker.

      for (var i = 0; i < markers.length; i++) {
        var node = null;
        var p_node = editor.node.blockParent(markers[i]);

        if (p_node) {
          node = p_node;
        } else {
          node = markers[i];
        }

        var next_node = node.nextSibling;
        var prev_node = node.previousSibling;

        while (next_node && next_node.tagName === 'BR') {
          next_node = next_node.nextSibling;
        }

        while (prev_node && prev_node.tagName === 'BR') {
          prev_node = prev_node.previousSibling;
        } // Push current node, prev and next one.


        if (node && nodes.indexOf(node) < 0) {
          nodes.push(node);
        }

        if (prev_node && nodes.indexOf(prev_node) < 0) {
          nodes.push(prev_node);
        }

        if (next_node && nodes.indexOf(next_node) < 0) {
          nodes.push(next_node);
        }
      }

      for (var j = 0; j < nodes.length; j++) {
        normalize(nodes[j]);
      }
    }

    return {
      normalize: normalize,
      normalizeAroundCursor: normalizeAroundCursor
    };
  };

  FroalaEditor.INVISIBLE_SPACE = '&#8203;';
  FroalaEditor.START_MARKER = "<span class=\"fr-marker\" data-id=\"0\" data-type=\"true\" style=\"display: none; line-height: 0;\">".concat(FroalaEditor.INVISIBLE_SPACE, "</span>");
  FroalaEditor.END_MARKER = "<span class=\"fr-marker\" data-id=\"0\" data-type=\"false\" style=\"display: none; line-height: 0;\">".concat(FroalaEditor.INVISIBLE_SPACE, "</span>");
  FroalaEditor.MARKERS = FroalaEditor.START_MARKER + FroalaEditor.END_MARKER;

  FroalaEditor.MODULES.markers = function (editor) {
    var $ = editor.$;
    /**
     * Build marker element.
     */

    function _build(marker, id) {
      var $span = $(editor.doc.createElement('SPAN'));
      $span.addClass('fr-marker').attr('data-id', id).attr('data-type', marker).attr('style', "display: ".concat(editor.browser.safari ? 'none' : 'inline-block', "; line-height: 0;")).html(FroalaEditor.INVISIBLE_SPACE);
      return $span.get(0);
    }
    /**
     * Place marker.
     */


    function place(range, marker, id) {
      var mk;
      var contents;
      var sibling;

      try {
        var boundary = range.cloneRange();
        boundary.collapse(marker);
        boundary.insertNode(_build(marker, id));

        if (marker === true) {
          mk = editor.$el.find("span.fr-marker[data-type=\"true\"][data-id=\"".concat(id, "\"]")).get(0);
          sibling = mk.nextSibling; // Clean empty spaces.

          while (sibling && sibling.nodeType === Node.TEXT_NODE && sibling.textContent.length === 0) {
            $(sibling).remove();
            sibling = mk.nextSibling;
          }
        }

        if (marker === true && !range.collapsed) {
          // Move markers outside of something like this:
          // <p><strong>fooM</strong>bar</p>
          while (!editor.node.isElement(mk.parentNode) && !sibling) {
            $(mk.parentNode).after(mk);
            sibling = mk.nextSibling;
          }

          if (sibling && sibling.nodeType === Node.ELEMENT_NODE && editor.node.isBlock(sibling) && sibling.tagName !== 'HR') {
            // Place the marker deep inside the block tags.
            contents = [sibling];

            do {
              sibling = contents[0];
              contents = editor.node.contents(sibling);
            } while (contents[0] && editor.node.isBlock(contents[0]));

            $(sibling).prepend($(mk));
          }
        }

        if (marker === false && !range.collapsed) {
          mk = editor.$el.find("span.fr-marker[data-type=\"false\"][data-id=\"".concat(id, "\"]")).get(0);
          sibling = mk.previousSibling;

          if (sibling && sibling.nodeType === Node.ELEMENT_NODE && editor.node.isBlock(sibling) && sibling.tagName !== 'HR') {
            // Place the marker deep inside the block tags.
            contents = [sibling];

            do {
              sibling = contents[contents.length - 1];
              contents = editor.node.contents(sibling);
            } while (contents[contents.length - 1] && editor.node.isBlock(contents[contents.length - 1]));

            $(sibling).append($(mk));
          } // https://github.com/froala/wysiwyg-editor/issues/705
          // https://github.com/froala-labs/froala-editor-js-2/issues/854


          if (mk.parentNode && ['TD', 'TH'].indexOf(mk.parentNode.tagName) >= 0 || !mk.previousSibling && editor.node.isBlock(mk.parentElement)) {
            if (mk.parentNode.previousSibling && !mk.previousSibling) {
              $(mk.parentNode.previousSibling).append(mk);
            }
          }
        }

        var dom_marker = editor.$el.find("span.fr-marker[data-type=\"".concat(marker, "\"][data-id=\"").concat(id, "\"]")).get(0); // If image is at the top of the editor in an empty P
        // and floated to right, the text will be pushed down
        // when trying to insert an image.

        if (dom_marker) {
          dom_marker.style.display = 'none';
        }

        return dom_marker;
      } catch (ex) {
        return null;
      }
    }
    /**
     * Insert a single marker.
     */


    function insert() {
      if (!editor.$wp) {
        return null;
      }

      try {
        var range = editor.selection.ranges(0);
        var container = range.commonAncestorContainer; // Check if selection is inside editor.

        if (container !== editor.el && !editor.$el.contains(container)) {
          return null;
        }

        var boundary = range.cloneRange();
        var original_range = range.cloneRange();
        boundary.collapse(true);
        var mk = $(editor.doc.createElement('SPAN')).addClass('fr-marker').attr('style', 'display: none; line-height: 0;').html(FroalaEditor.INVISIBLE_SPACE).get(0);
        boundary.insertNode(mk);
        mk = editor.$el.find('span.fr-marker').get(0);

        if (mk) {
          var sibling = mk.nextSibling;

          while (sibling && sibling.nodeType === Node.TEXT_NODE && sibling.textContent.length === 0) {
            $(sibling).remove();
            sibling = editor.$el.find('span.fr-marker').get(0).nextSibling;
          } // Keep original selection.


          editor.selection.clear();
          editor.selection.get().addRange(original_range);
          return mk;
        }

        return null;
      } catch (ex) {
        console.warn('MARKER', ex);
      }
    }
    /**
     * Split HTML at the marker position.
     */


    function split() {
      if (!editor.selection.isCollapsed()) {
        editor.selection.remove();
      }

      var marker = editor.$el.find('.fr-marker').get(0);

      if (!marker) {
        marker = insert();
      }

      if (!marker) {
        return null;
      }

      var deep_parent = editor.node.deepestParent(marker);

      if (!deep_parent) {
        deep_parent = editor.node.blockParent(marker);

        if (deep_parent && deep_parent.tagName !== 'LI') {
          deep_parent = null;
        }
      }

      if (deep_parent) {
        if (editor.node.isBlock(deep_parent) && editor.node.isEmpty(deep_parent)) {
          // https://github.com/froala/wysiwyg-editor/issues/1730.
          // https://github.com/froala/wysiwyg-editor/issues/1970.
          if (deep_parent.tagName === 'LI' && deep_parent.parentNode.firstElementChild === deep_parent && !editor.node.isEmpty(deep_parent.parentNode)) {
            $(deep_parent).append('<span class="fr-marker"></span>');
          } else {
            $(deep_parent).replaceWith('<span class="fr-marker"></span>');
          }
        } else if (editor.cursor.isAtStart(marker, deep_parent)) {
          $(deep_parent).before('<span class="fr-marker"></span>');
          $(marker).remove();
        } else if (editor.cursor.isAtEnd(marker, deep_parent)) {
          $(deep_parent).after('<span class="fr-marker"></span>');
          $(marker).remove();
        } else {
          var node = marker;
          var close_str = '';
          var open_str = '';

          do {
            node = node.parentNode;
            close_str += editor.node.closeTagString(node);
            open_str = editor.node.openTagString(node) + open_str;
          } while (node !== deep_parent);

          $(marker).replaceWith('<span id="fr-break"></span>');
          var h = editor.node.openTagString(deep_parent) + $(deep_parent).html() + editor.node.closeTagString(deep_parent);
          h = h.replace(/<span id="fr-break"><\/span>/g, "".concat(close_str, "<span class=\"fr-marker\"></span>").concat(open_str));
          $(deep_parent).replaceWith(h);
        }
      }

      return editor.$el.find('.fr-marker').get(0);
    }
    /**
     * Insert marker at point from event.
     *
     * http://stackoverflow.com/questions/11191136/set-a-selection-range-from-a-to-b-in-absolute-position
     * https://developer.mozilla.org/en-US/docs/Web/API/this.document.caretPositionFromPoint
     */


    function insertAtPoint(e) {
      var x = e.clientX;
      var y = e.clientY; // Clear markers.

      remove();
      var start;
      var range = null; // Default.

      if (typeof editor.doc.caretPositionFromPoint !== 'undefined') {
        start = editor.doc.caretPositionFromPoint(x, y);
        range = editor.doc.createRange();
        range.setStart(start.offsetNode, start.offset);
        range.setEnd(start.offsetNode, start.offset);
      } // Webkit.
      else if (typeof editor.doc.caretRangeFromPoint !== 'undefined') {
          start = editor.doc.caretRangeFromPoint(x, y);
          range = editor.doc.createRange();
          range.setStart(start.startContainer, start.startOffset);
          range.setEnd(start.startContainer, start.startOffset);
        } // Set ranges.


      if (range !== null && typeof editor.win.getSelection !== 'undefined') {
        var sel = editor.win.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } // MSIE.
      else if (typeof editor.doc.body.createTextRange !== 'undefined') {
          try {
            range = editor.doc.body.createTextRange();
            range.moveToPoint(x, y);
            var end_range = range.duplicate();
            end_range.moveToPoint(x, y);
            range.setEndPoint('EndToEnd', end_range);
            range.select();
          } catch (ex) {
            return false;
          }
        }

      insert();
    }
    /**
     * Remove markers.
     */


    function remove() {
      editor.$el.find('.fr-marker').remove();
    }

    return {
      place: place,
      insert: insert,
      split: split,
      insertAtPoint: insertAtPoint,
      remove: remove
    };
  };

  FroalaEditor.MODULES.selection = function (editor) {
    var $ = editor.$;
    /**
     * Get selection text.
     */

    function text() {
      var text = '';

      if (editor.win.getSelection) {
        text = editor.win.getSelection();
      } else if (editor.doc.getSelection) {
        text = editor.doc.getSelection();
      } else if (editor.doc.selection) {
        text = editor.doc.selection.createRange().text;
      }

      return text.toString();
    }
    /**
     * Get the selection object.
     */


    function get() {
      var selection = '';

      if (editor.win.getSelection) {
        selection = editor.win.getSelection();
      } else if (editor.doc.getSelection) {
        selection = editor.doc.getSelection();
      } else {
        selection = editor.doc.selection.createRange();
      }

      return selection;
    }
    /**
     * Get the selection ranges or a single range at a specified index.
     */


    function ranges(index) {
      var sel = get();
      var ranges = []; // Get ranges.

      if (sel && sel.getRangeAt && sel.rangeCount) {
        ranges = [];

        for (var i = 0; i < sel.rangeCount; i++) {
          ranges.push(sel.getRangeAt(i));
        }
      } else if (editor.doc.createRange) {
        ranges = [editor.doc.createRange()];
      } else {
        ranges = [];
      }

      return typeof index !== 'undefined' ? ranges[index] : ranges;
    }
    /**
     * Clear selection.
     */


    function clear() {
      var sel = get();

      try {
        if (sel.removeAllRanges) {
          sel.removeAllRanges();
        } else if (sel.empty) {
          // IE?
          sel.empty();
        } else if (sel.clear) {
          sel.clear();
        }
      } catch (ex) {// ok.
      }
    }
    /**
     * Selection element.
     */


    function element() {
      var sel = get();

      try {
        if (sel.rangeCount) {
          var range = ranges(0);
          var node = range.startContainer;
          var child; // When selection starts in element, look deeper.

          if (editor.node.isElement(node) && range.startOffset === 0 && node.childNodes.length) {
            while (node.childNodes.length && node.childNodes[0].nodeType === Node.ELEMENT_NODE) {
              node = node.childNodes[0];
            }
          } // https://github.com/froala/wysiwyg-editor/issues/1399.


          if (node.nodeType === Node.TEXT_NODE && range.startOffset === (node.textContent || '').length && node.nextSibling) {
            node = node.nextSibling;
          } // Get parrent if node type is not DOM.


          if (node.nodeType === Node.ELEMENT_NODE) {
            var node_found = false; // Search for node deeper.

            if (node.childNodes.length > 0 && node.childNodes[range.startOffset]) {
              child = node.childNodes[range.startOffset]; // Ignore empty elements.

              while (child && child.nodeType === Node.TEXT_NODE && child.textContent.length === 0) {
                child = child.nextSibling;
              }

              if (child && child.textContent.replace(/\u200B/g, '') === text().replace(/\u200B/g, '')) {
                node = child;
                node_found = true;
              } // Look back maybe me missed something.


              if (!node_found && node.childNodes.length > 1 && range.startOffset > 0 && node.childNodes[range.startOffset - 1]) {
                child = node.childNodes[range.startOffset - 1];

                while (child && child.nodeType === Node.TEXT_NODE && child.textContent.length === 0) {
                  child = child.nextSibling;
                }

                if (child && child.textContent.replace(/\u200B/g, '') === text().replace(/\u200B/g, '')) {
                  node = child;
                  node_found = true;
                }
              }
            } // Selection starts just at the end of the node.
            else if (!range.collapsed && node.nextSibling && node.nextSibling.nodeType === Node.ELEMENT_NODE) {
                child = node.nextSibling;

                if (child && child.textContent.replace(/\u200B/g, '') === text().replace(/\u200B/g, '')) {
                  node = child;
                  node_found = true;
                }
              }

            if (!node_found && node.childNodes.length > 0 && $(node.childNodes[0]).text().replace(/\u200B/g, '') === text().replace(/\u200B/g, '') && ['BR', 'IMG', 'HR'].indexOf(node.childNodes[0].tagName) < 0) {
              node = node.childNodes[0];
            }
          }

          while (node.nodeType !== Node.ELEMENT_NODE && node.parentNode) {
            node = node.parentNode;
          } // Make sure the node is in editor.


          var p = node;

          while (p && p.tagName !== 'HTML') {
            if (p === editor.el) {
              return node;
            }

            p = $(p).parent()[0];
          }
        }
      } catch (ex) {// ok.
      }

      return editor.el;
    }
    /**
     * Selection element.
     */


    function endElement() {
      var sel = get();

      try {
        if (sel.rangeCount) {
          var range = ranges(0);
          var node = range.endContainer;
          var child; // Get parrent if node type is not DOM.

          if (node.nodeType === Node.ELEMENT_NODE) {
            var node_found = false; // Search for node deeper.

            if (node.childNodes.length > 0 && node.childNodes[range.endOffset] && $(node.childNodes[range.endOffset]).text() === text()) {
              node = node.childNodes[range.endOffset];
              node_found = true;
            } // Selection starts just at the end of the node.
            else if (!range.collapsed && node.previousSibling && node.previousSibling.nodeType === Node.ELEMENT_NODE) {
                child = node.previousSibling;

                if (child && child.textContent.replace(/\u200B/g, '') === text().replace(/\u200B/g, '')) {
                  node = child;
                  node_found = true;
                }
              } // Browser sees selection at the beginning of the next node.
              else if (!range.collapsed && node.childNodes.length > 0 && node.childNodes[range.endOffset]) {
                  child = node.childNodes[range.endOffset].previousSibling;

                  if (child.nodeType === Node.ELEMENT_NODE) {
                    if (child && child.textContent.replace(/\u200B/g, '') === text().replace(/\u200B/g, '')) {
                      node = child;
                      node_found = true;
                    }
                  }
                }

            if (!node_found && node.childNodes.length > 0 && $(node.childNodes[node.childNodes.length - 1]).text() === text() && ['BR', 'IMG', 'HR'].indexOf(node.childNodes[node.childNodes.length - 1].tagName) < 0) {
              node = node.childNodes[node.childNodes.length - 1];
            }
          }

          if (node.nodeType === Node.TEXT_NODE && range.endOffset === 0 && node.previousSibling && node.previousSibling.nodeType === Node.ELEMENT_NODE) {
            node = node.previousSibling;
          }

          while (node.nodeType !== Node.ELEMENT_NODE && node.parentNode) {
            node = node.parentNode;
          } // Make sure the node is in editor.


          var p = node;

          while (p && p.tagName !== 'HTML') {
            if (p === editor.el) {
              return node;
            }

            p = $(p).parent()[0];
          }
        }
      } catch (ex) {// ok.
      }

      return editor.el;
    }
    /**
     * Get the ELEMENTS node where the selection starts.
     * By default TEXT node might be selected.
     */


    function rangeElement(rangeContainer, offset) {
      var node = rangeContainer;

      if (node.nodeType === Node.ELEMENT_NODE) {
        // Search for node deeper.
        if (node.childNodes.length > 0 && node.childNodes[offset]) {
          node = node.childNodes[offset];
        }
      }

      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
      }

      return node;
    }
    /**
     * Search for the current selected blocks.
     */


    function blocks() {
      var blks = [];
      var i;
      var block_parent;
      var sel = get(); // Selection must be inside editor.

      if (inEditor() && sel.rangeCount) {
        // Loop through ranges.
        var rngs = ranges();

        for (i = 0; i < rngs.length; i++) {
          var range = rngs[i]; // Get start node and end node for range.

          var start_node = rangeElement(range.startContainer, range.startOffset);
          var end_node = rangeElement(range.endContainer, range.endOffset); // Add the start node.

          if ((editor.node.isBlock(start_node) || editor.node.hasClass(start_node, 'fr-inner')) && blks.indexOf(start_node) < 0) {
            blks.push(start_node);
          } // Check for the parent node of the start node.


          block_parent = editor.node.blockParent(start_node);

          if (block_parent && blks.indexOf(block_parent) < 0) {
            blks.push(block_parent);
          } // Do not add nodes where we've been once.


          var was_into = []; // Loop until we reach end.

          var next_node = start_node;

          while (next_node !== end_node && next_node !== editor.el) {
            // Get deeper into the current node.
            if (was_into.indexOf(next_node) < 0 && next_node.children && next_node.children.length) {
              was_into.push(next_node);
              next_node = next_node.children[0];
            } // Get next sibling.
            else if (next_node.nextSibling) {
                next_node = next_node.nextSibling;
              } // Get parent node.
              else if (next_node.parentNode) {
                  next_node = next_node.parentNode;
                  was_into.push(next_node);
                } // Add node to the list.


            if (editor.node.isBlock(next_node) && was_into.indexOf(next_node) < 0 && blks.indexOf(next_node) < 0) {
              if (next_node !== end_node || range.endOffset > 0) {
                blks.push(next_node);
              }
            }
          } // Add the end node.


          if (editor.node.isBlock(end_node) && blks.indexOf(end_node) < 0 && range.endOffset > 0) {
            blks.push(end_node);
          } // Check for the parent node of the end node.


          block_parent = editor.node.blockParent(end_node);

          if (block_parent && blks.indexOf(block_parent) < 0) {
            blks.push(block_parent);
          }
        }
      } // Remove blocks that we don't need.


      for (i = blks.length - 1; i > 0; i--) {
        // Nodes that contain another node. Don't do it for LI, but remove them if there is a single child and has format.
        if ($(blks[i]).find(blks).length) {
          blks.splice(i, 1);
        }
      }

      return blks;
    }
    /**
     * Save selection.
     */


    function save() {
      if (editor.$wp) {
        editor.markers.remove();
        var rgs = ranges();
        var new_ranges = [];
        var range;
        var i;

        for (i = 0; i < rgs.length; i++) {
          // 2nd condition is for https://github.com/froala/wysiwyg-editor/issues/1750.
          if (rgs[i].startContainer !== editor.doc || editor.browser.msie) {
            range = rgs[i];
            var collapsed = range.collapsed;
            var start_m = editor.markers.place(range, true, i); // Start.

            var end_m = editor.markers.place(range, false, i); // End.
            // Put selection at the end when there is no marker.

            if ((typeof start_m === 'undefined' || !start_m) && collapsed) {
              $('.fr-marker').remove();
              editor.selection.setAtEnd(editor.el);
            } // https://github.com/froala/wysiwyg-editor/issues/1398.


            editor.el.normalize();

            if (editor.browser.safari && !collapsed) {
              try {
                range = editor.doc.createRange();
                range.setStartAfter(start_m);
                range.setEndBefore(end_m);
                new_ranges.push(range);
              } catch (ex) {// Leave this empty.
              }
            }
          }
        }

        if (editor.browser.safari && new_ranges.length) {
          editor.selection.clear();

          for (i = 0; i < new_ranges.length; i++) {
            editor.selection.get().addRange(new_ranges[i]);
          }
        }
      }
    }
    /**
     * Restore selection.
     */


    function restore() {
      var i; // Get markers.

      var markers = editor.el.querySelectorAll('.fr-marker[data-type="true"]');

      if (!editor.$wp) {
        editor.markers.remove();
        return false;
      } // No markers.


      if (markers.length === 0) {
        return false;
      }

      if (editor.browser.msie || editor.browser.edge) {
        for (i = 0; i < markers.length; i++) {
          markers[i].style.display = 'inline-block';
        }
      } // Focus.


      if (!editor.core.hasFocus() && !editor.browser.msie && !editor.browser.webkit) {
        editor.$el.focus();
      }

      clear();
      var sel = get(); // Add ranges.

      for (i = 0; i < markers.length; i++) {
        var id = $(markers[i]).data('id');
        var start_marker = markers[i];
        var range = editor.doc.createRange();
        var end_marker = editor.$el.find(".fr-marker[data-type=\"false\"][data-id=\"".concat(id, "\"]"));

        if (editor.browser.msie || editor.browser.edge) {
          end_marker.css('display', 'inline-block');
        }

        var ghost = null; // Make sure there is an start marker.

        if (end_marker.length > 0) {
          end_marker = end_marker[0];

          try {
            // If we have markers one next to each other inside text, then we should normalize text by joining it.
            var special_case = false; // Clear empty text nodes.

            var s_node = start_marker.nextSibling;
            var tmp = null;

            while (s_node && s_node.nodeType === Node.TEXT_NODE && s_node.textContent.length === 0) {
              tmp = s_node;
              s_node = s_node.nextSibling;
              $(tmp).remove();
            }

            var e_node = end_marker.nextSibling;

            while (e_node && e_node.nodeType === Node.TEXT_NODE && e_node.textContent.length === 0) {
              tmp = e_node;
              e_node = e_node.nextSibling;
              $(tmp).remove();
            }

            if (start_marker.nextSibling === end_marker || end_marker.nextSibling === start_marker) {
              // Decide which is first and which is last between markers.
              var first_node = start_marker.nextSibling === end_marker ? start_marker : end_marker;
              var last_node = first_node === start_marker ? end_marker : start_marker; // Previous node.

              var prev_node = first_node.previousSibling;

              while (prev_node && prev_node.nodeType === Node.TEXT_NODE && prev_node.length === 0) {
                tmp = prev_node;
                prev_node = prev_node.previousSibling;
                $(tmp).remove();
              } // Normalize text before.


              if (prev_node && prev_node.nodeType === Node.TEXT_NODE) {
                while (prev_node && prev_node.previousSibling && prev_node.previousSibling.nodeType === Node.TEXT_NODE) {
                  prev_node.previousSibling.textContent += prev_node.textContent;
                  prev_node = prev_node.previousSibling;
                  $(prev_node.nextSibling).remove();
                }
              } // Next node.


              var next_node = last_node.nextSibling;

              while (next_node && next_node.nodeType === Node.TEXT_NODE && next_node.length === 0) {
                tmp = next_node;
                next_node = next_node.nextSibling;
                $(tmp).remove();
              } // Normalize text after.


              if (next_node && next_node.nodeType === Node.TEXT_NODE) {
                while (next_node && next_node.nextSibling && next_node.nextSibling.nodeType === Node.TEXT_NODE) {
                  next_node.nextSibling.textContent = next_node.textContent + next_node.nextSibling.textContent;
                  next_node = next_node.nextSibling;
                  $(next_node.previousSibling).remove();
                }
              }

              if (prev_node && (editor.node.isVoid(prev_node) || editor.node.isBlock(prev_node))) {
                prev_node = null;
              }

              if (next_node && (editor.node.isVoid(next_node) || editor.node.isBlock(next_node))) {
                next_node = null;
              } // Previous node and next node are both text.


              if (prev_node && next_node && prev_node.nodeType === Node.TEXT_NODE && next_node.nodeType === Node.TEXT_NODE) {
                // Remove markers.
                $(start_marker).remove();
                $(end_marker).remove(); // Save cursor position.

                var len = prev_node.textContent.length;
                prev_node.textContent += next_node.textContent;
                $(next_node).remove(); // Normalize spaces.

                if (!editor.opts.htmlUntouched) {
                  editor.spaces.normalize(prev_node);
                } // Restore position.


                range.setStart(prev_node, len);
                range.setEnd(prev_node, len);
                special_case = true;
              } else if (!prev_node && next_node && next_node.nodeType === Node.TEXT_NODE) {
                // Remove markers.
                $(start_marker).remove();
                $(end_marker).remove(); // Normalize spaces.

                if (!editor.opts.htmlUntouched) {
                  editor.spaces.normalize(next_node);
                }

                ghost = $(editor.doc.createTextNode("\u200B")).get(0);
                $(next_node).before(ghost); // Restore position.

                range.setStart(next_node, 0);
                range.setEnd(next_node, 0);
                special_case = true;
              } else if (!next_node && prev_node && prev_node.nodeType === Node.TEXT_NODE) {
                // Remove markers.
                $(start_marker).remove();
                $(end_marker).remove(); // Normalize spaces.

                if (!editor.opts.htmlUntouched) {
                  editor.spaces.normalize(prev_node);
                }

                ghost = $(editor.doc.createTextNode("\u200B")).get(0);
                $(prev_node).after(ghost); // Restore position.

                range.setStart(prev_node, prev_node.textContent.length);
                range.setEnd(prev_node, prev_node.textContent.length);
                special_case = true;
              }
            }

            if (!special_case) {
              var x = void 0;
              var y = void 0; // DO NOT TOUCH THIS OR IT WILL BREAK!!!

              if ((editor.browser.chrome || editor.browser.edge) && start_marker.nextSibling === end_marker) {
                x = _normalizedMarker(end_marker, range, true) || range.setStartAfter(end_marker);
                y = _normalizedMarker(start_marker, range, false) || range.setEndBefore(start_marker);
              } else {
                if (start_marker.previousSibling === end_marker) {
                  start_marker = end_marker;
                  end_marker = start_marker.nextSibling;
                } // https://github.com/froala/wysiwyg-editor/issues/759


                if (!(end_marker.nextSibling && end_marker.nextSibling.tagName === 'BR') && !(!end_marker.nextSibling && editor.node.isBlock(start_marker.previousSibling)) && !(start_marker.previousSibling && start_marker.previousSibling.tagName === 'BR')) {
                  start_marker.style.display = 'inline';
                  end_marker.style.display = 'inline';
                  ghost = $(editor.doc.createTextNode("\u200B")).get(0);
                } // https://github.com/froala/wysiwyg-editor/issues/1120 . TODO Check again the below statement on which !editor.opts.enter === FE.ENTER_BR is returing false always.
                // var p_node = start_marker.previousSibling;
                // if (p_node && p_node.style && editor.win.getComputedStyle(p_node).display === 'block' && !editor.opts.enter === FE.ENTER_BR) {
                //   range.setEndAfter(p_node);
                //   range.setStartAfter(p_node);
                // }
                // else {
                //   x = _normalizedMarker(start_marker, range, true) || ($(start_marker).before(ghost) && range.setStartBefore(start_marker));
                //   y = _normalizedMarker(end_marker, range, false) || ($(end_marker).after(ghost) && range.setEndAfter(end_marker));
                // }


                x = _normalizedMarker(start_marker, range, true) || $(start_marker).before(ghost) && range.setStartBefore(start_marker);
                y = _normalizedMarker(end_marker, range, false) || $(end_marker).after(ghost) && range.setEndAfter(end_marker);
              }

              if (typeof x === 'function') {
                x();
              }

              if (typeof y === 'function') {
                y();
              }
            }
          } catch (ex) {
            console.warn('RESTORE RANGE', ex);
          }
        }

        if (ghost) {
          $(ghost).remove();
        }

        try {
          sel.addRange(range);
        } catch (ex) {
          console.warn('ADD RANGE', ex);
        }
      } // Remove used markers.


      editor.markers.remove();
    }
    /**
     * Normalize marker when restoring selection.
     */


    function _normalizedMarker(marker, range, start) {
      var len;
      var prev_node = marker.previousSibling;
      var next_node = marker.nextSibling; // Prev and next node are both text nodes.

      if (prev_node && next_node && prev_node.nodeType === Node.TEXT_NODE && next_node.nodeType === Node.TEXT_NODE) {
        len = prev_node.textContent.length;

        if (start) {
          next_node.textContent = prev_node.textContent + next_node.textContent;
          $(prev_node).remove();
          $(marker).remove();

          if (!editor.opts.htmlUntouched) {
            editor.spaces.normalize(next_node);
          }

          return function () {
            range.setStart(next_node, len);
          };
        }

        prev_node.textContent += next_node.textContent;
        $(next_node).remove();
        $(marker).remove();

        if (!editor.opts.htmlUntouched) {
          editor.spaces.normalize(prev_node);
        }

        return function () {
          range.setEnd(prev_node, len);
        };
      } // Prev node is text node.
      else if (prev_node && !next_node && prev_node.nodeType === Node.TEXT_NODE) {
          len = prev_node.textContent.length;

          if (start) {
            if (!editor.opts.htmlUntouched) {
              editor.spaces.normalize(prev_node);
            }

            return function () {
              range.setStart(prev_node, len);
            };
          }

          if (!editor.opts.htmlUntouched) {
            editor.spaces.normalize(prev_node);
          }

          return function () {
            range.setEnd(prev_node, len);
          };
        } // Next node is text node.
        else if (next_node && !prev_node && next_node.nodeType === Node.TEXT_NODE) {
            if (start) {
              if (!editor.opts.htmlUntouched) {
                editor.spaces.normalize(next_node);
              }

              return function () {
                range.setStart(next_node, 0);
              };
            }

            if (!editor.opts.htmlUntouched) {
              editor.spaces.normalize(next_node);
            }

            return function () {
              range.setEnd(next_node, 0);
            };
          }

      return false;
    }
    /**
     * Determine if we can do delete.
     */


    function _canDelete() {
      // Check if there are markers inside conteneditable="false".
      var markers = editor.$el.find('.fr-marker');

      for (var i = 0; i < markers.length; i++) {
        if ($(markers[i]).parentsUntil('.fr-element, [contenteditable="true"]', '[contenteditable="false"]').length) {
          return false;
        }
      }

      return true;
    }
    /**
     * Check if selection is collapsed.
     */


    function isCollapsed() {
      var rgs = ranges();

      for (var i = 0; i < rgs.length; i++) {
        if (!rgs[i].collapsed) {
          return false;
        }
      }

      return true;
    } // From: http://www.coderexception.com/0B1B33z1NyQxUQSJ/contenteditable-div-how-can-i-determine-if-the-cursor-is-at-the-start-or-end-of-the-content


    function info(el) {
      var atStart = false;
      var atEnd = false;
      var selRange;
      var testRange;

      if (editor.win.getSelection) {
        var sel = editor.win.getSelection();

        if (sel.rangeCount) {
          selRange = sel.getRangeAt(0);
          testRange = selRange.cloneRange();
          testRange.selectNodeContents(el);
          testRange.setEnd(selRange.startContainer, selRange.startOffset);
          atStart = testRange.toString() === '';
          testRange.selectNodeContents(el);
          testRange.setStart(selRange.endContainer, selRange.endOffset);
          atEnd = testRange.toString() === '';
        }
      } else if (editor.doc.selection && editor.doc.selection.type !== 'Control') {
        selRange = editor.doc.selection.createRange();
        testRange = selRange.duplicate();
        testRange.moveToElementText(el);
        testRange.setEndPoint('EndToStart', selRange);
        atStart = testRange.text === '';
        testRange.moveToElementText(el);
        testRange.setEndPoint('StartToEnd', selRange);
        atEnd = testRange.text === '';
      }

      return {
        atStart: atStart,
        atEnd: atEnd
      };
    }
    /**
     * Check if everything is selected inside the editor.
     */


    function isFull() {
      if (isCollapsed()) {
        return false;
      }

      editor.selection.save(); // https://github.com/froala/wysiwyg-editor/issues/710

      var els = editor.el.querySelectorAll('td, th, img, br');
      var i;

      for (i = 0; i < els.length; i++) {
        if (els[i].nextSibling) {
          els[i].innerHTML = "<span class=\"fr-mk\">".concat(FroalaEditor.INVISIBLE_SPACE, "</span>").concat(els[i].innerHTML);
        }
      }

      var full = false;
      var inf = info(editor.el);

      if (inf.atStart && inf.atEnd) {
        full = true;
      } // https://github.com/froala/wysiwyg-editor/issues/710


      els = editor.el.querySelectorAll('.fr-mk');

      for (i = 0; i < els.length; i++) {
        els[i].parentNode.removeChild(els[i]);
      }

      editor.selection.restore();
      return full;
    }
    /**
     * Remove HTML from inner nodes when we deal with keepFormatOnDelete option.
     */


    function _emptyInnerNodes(node, first) {
      if (typeof first === 'undefined') {
        first = true;
      } // Remove invisible spaces.


      var h = $(node).html();

      if (h && h.replace(/\u200b/g, '').length !== h.length) {
        $(node).html(h.replace(/\u200b/g, ''));
      } // Loop contents.


      var contents = editor.node.contents(node);

      for (var j = 0; j < contents.length; j++) {
        // Remove text nodes.
        if (contents[j].nodeType !== Node.ELEMENT_NODE) {
          $(contents[j]).remove();
        } // Empty inner nodes further.
        else {
            // j === 0 determines if the node is the first one and we should keep format.
            _emptyInnerNodes(contents[j], j === 0); // There are inner nodes, ignore the current one.


            if (j === 0) {
              first = false;
            }
          }
      } // First node is a text node, so replace it with a span.


      if (node.nodeType === Node.TEXT_NODE) {
        var span = $(document.createElement('span')).attr('data-first', 'true').attr('data-text', 'true');
        $(node)[0].replaceWith(span[0]);
      } // Add the first node marker so that we add selection in it later on.
      else if (first) {
          $(node).attr('data-first', true);
        }
    }
    /**
     * TODO: check again this function because it will always return true because fr-inner tag does not exist.
     */


    function _filterFrInner() {
      return $(this).find('fr-inner').length === 0;
    }
    /**
     * Process deleting nodes.
     */


    function _processNodeDelete($node, should_delete) {
      var contents = editor.node.contents($node.get(0)); // Node is TD or TH.

      if (['TD', 'TH'].indexOf($node.get(0).tagName) >= 0 && $node.find('.fr-marker').length === 1 && (editor.node.hasClass(contents[0], 'fr-marker') || contents[0].tagName == 'BR' && editor.node.hasClass(contents[0].nextElementSibling, 'fr-marker'))) {
        $node.attr('data-del-cell', true);
      }

      for (var i = 0; i < contents.length; i++) {
        var node = contents[i]; // We found a marker.

        if (editor.node.hasClass(node, 'fr-marker')) {
          should_delete = (should_delete + 1) % 2;
        } else if (should_delete) {
          // Check if we have a marker inside it.
          if ($(node).find('.fr-marker').length > 0) {
            should_delete = _processNodeDelete($(node), should_delete);
          } else {
            // TD, TH or inner, then go further.
            if (['TD', 'TH'].indexOf(node.tagName) < 0 && !editor.node.hasClass(node, 'fr-inner')) {
              if (!editor.opts.keepFormatOnDelete || editor.$el.find('[data-first]').length > 0 || editor.node.isVoid(node)) {
                $(node).remove();
              } else {
                _emptyInnerNodes(node);
              }
            } else if (editor.node.hasClass(node, 'fr-inner')) {
              if ($(node).find('.fr-inner').length === 0) {
                $(node).html('<br>');
              } else {
                $(node).find('.fr-inner').filter(_filterFrInner).html('<br>');
              }
            } else {
              $(node).empty();
              $(node).attr('data-del-cell', true);
            }
          }
        } else if ($(node).find('.fr-marker').length > 0) {
          should_delete = _processNodeDelete($(node), should_delete);
        }
      }

      return should_delete;
    }
    /**
     * Determine if selection is inside the editor.
     */


    function inEditor() {
      try {
        if (!editor.$wp) {
          return false;
        }

        var range = ranges(0);
        var container = range.commonAncestorContainer;

        while (container && !editor.node.isElement(container)) {
          container = container.parentNode;
        }

        if (editor.node.isElement(container)) {
          return true;
        }

        return false;
      } catch (ex) {
        return false;
      }
    }
    /**
     * Remove the current selection html.
     */


    function remove() {
      if (isCollapsed()) {
        return true;
      }

      var i;
      save(); // Get the previous sibling normalized.

      function _prevSibling(node) {
        var prev_node = node.previousSibling;

        while (prev_node && prev_node.nodeType === Node.TEXT_NODE && prev_node.textContent.length === 0) {
          var tmp = prev_node;
          prev_node = prev_node.previousSibling;
          $(tmp).remove();
        }

        return prev_node;
      } // Get the next sibling normalized.


      function _nextSibling(node) {
        var next_node = node.nextSibling;

        while (next_node && next_node.nodeType === Node.TEXT_NODE && next_node.textContent.length === 0) {
          var tmp = next_node;
          next_node = next_node.nextSibling;
          $(tmp).remove();
        }

        return next_node;
      } // Normalize start markers.


      var start_markers = editor.$el.find('.fr-marker[data-type="true"]');

      for (i = 0; i < start_markers.length; i++) {
        var sm = start_markers[i];

        while (!_prevSibling(sm) && !editor.node.isBlock(sm.parentNode) && !editor.$el.is(sm.parentNode) && !editor.node.hasClass(sm.parentNode, 'fr-inner')) {
          $(sm.parentNode).before(sm);
        }
      } // Normalize end markers.


      var end_markers = editor.$el.find('.fr-marker[data-type="false"]');

      for (i = 0; i < end_markers.length; i++) {
        var em = end_markers[i];

        while (!_nextSibling(em) && !editor.node.isBlock(em.parentNode) && !editor.$el.is(em.parentNode) && !editor.node.hasClass(em.parentNode, 'fr-inner')) {
          $(em.parentNode).after(em);
        } // Last node is empty and has a BR in it.


        if (em.parentNode && editor.node.isBlock(em.parentNode) && editor.node.isEmpty(em.parentNode) && !editor.$el.is(em.parentNode) && !editor.node.hasClass(em.parentNode, 'fr-inner') && editor.opts.keepFormatOnDelete) {
          $(em.parentNode).after(em);
        }
      } // Check if selection can be deleted.


      if (_canDelete()) {
        _processNodeDelete(editor.$el, 0); // Look for selection marker.


        var $first_node = editor.$el.find('[data-first="true"]');

        if ($first_node.length) {
          // Remove markers.
          editor.$el.find('.fr-marker').remove(); // Add markers in the node that we marked as the first one.

          $first_node.append(FroalaEditor.INVISIBLE_SPACE + FroalaEditor.MARKERS).removeAttr('data-first'); // Remove span with data-text if there is one.

          if ($first_node.attr('data-text')) {
            $first_node.replaceWith($first_node.html());
          }
        } else {
          // Remove tables.
          editor.$el.find('table').filter(function () {
            var ok = $(this).find('[data-del-cell]').length > 0 && $(this).find('[data-del-cell]').length === $(this).find('td, th').length;
            return ok;
          }).remove();
          editor.$el.find('[data-del-cell]').removeAttr('data-del-cell'); // Merge contents between markers.

          start_markers = editor.$el.find('.fr-marker[data-type="true"]');

          for (i = 0; i < start_markers.length; i++) {
            // Get start marker.
            var start_marker = start_markers[i]; // Get the next node after start marker.

            var next_node = start_marker.nextSibling; // Get the end node.

            var end_marker = editor.$el.find(".fr-marker[data-type=\"false\"][data-id=\"".concat($(start_marker).data('id'), "\"]")).get(0);

            if (end_marker) {
              // Markers are not next to other.
              if (start_marker && !(next_node && next_node === end_marker)) {
                // Get the parents of the nodes.
                var start_parent = editor.node.blockParent(start_marker);
                var end_parent = editor.node.blockParent(end_marker); // https://github.com/froala/wysiwyg-editor/issues/1233

                var list_start = false;
                var list_end = false;

                if (start_parent && ['UL', 'OL'].indexOf(start_parent.tagName) >= 0) {
                  start_parent = null;
                  list_start = true;
                }

                if (end_parent && ['UL', 'OL'].indexOf(end_parent.tagName) >= 0) {
                  end_parent = null;
                  list_end = true;
                } // Move end marker next to start marker.


                $(start_marker).after(end_marker); // The block parent of the start marker is the element itself. We're not in the same parent or moving marker is not enough.

                if (start_parent !== end_parent) {
                  if (start_parent === null && !list_start) {
                    var deep_parent = editor.node.deepestParent(start_marker); // There is a parent for the marker. Move the end html to it.

                    if (deep_parent) {
                      $(deep_parent).after($(end_parent).html());
                      $(end_parent).remove();
                    } // There is no parent for the marker.
                    else if ($(end_parent).parentsUntil(editor.$el, 'table').length === 0) {
                        $(start_marker).next().after($(end_parent).html());
                        $(end_parent).remove();
                      }
                  } // End marker is inside element. We don't merge in table.
                  else if (end_parent === null && !list_end && $(start_parent).parentsUntil(editor.$el, 'table').length === 0) {
                      // Get the node that has a next sibling.
                      next_node = start_parent;

                      while (!next_node.nextSibling && next_node.parentNode !== editor.el) {
                        next_node = next_node.parentNode;
                      }

                      next_node = next_node.nextSibling; // Join HTML inside the start node.

                      while (next_node && next_node.tagName !== 'BR') {
                        var tmp_node = next_node.nextSibling;
                        $(start_parent).append(next_node);
                        next_node = tmp_node;
                      }

                      if (next_node && next_node.tagName === 'BR') {
                        $(next_node).remove();
                      }
                    } // Join end block with start block.
                    else if (start_parent && end_parent && $(start_parent).parentsUntil(editor.$el, 'table').length === 0 && $(end_parent).parentsUntil(editor.$el, 'table').length === 0 && !$(start_parent).contains(end_parent) && !$(end_parent).contains(start_parent)) {
                        $(start_parent).append($(end_parent).html());
                        $(end_parent).remove();
                      }
                }
              }
            } else {
              end_marker = $(start_marker).clone().attr('data-type', false);
              $(start_marker).after(end_marker);
            }
          }
        }
      } // Remove remaining empty lists.


      editor.$el.find('li:empty').remove();

      if (!editor.opts.keepFormatOnDelete) {
        editor.html.fillEmptyBlocks();
      }

      editor.html.cleanEmptyTags(true);

      if (!editor.opts.htmlUntouched) {
        editor.clean.lists();
        editor.$el.find('li:empty').append('<br>');
        editor.spaces.normalize();
      } // https://github.com/froala/wysiwyg-editor/issues/1379 &&


      var last_marker = editor.$el.find('.fr-marker').last().get(0);
      var first_marker = editor.$el.find('.fr-marker').first().get(0); // https://github.com/froala-labs/froala-editor-js-2/issues/491

      if (typeof last_marker !== 'undefined' && typeof first_marker !== 'undefined' && !last_marker.nextSibling && first_marker.previousSibling && first_marker.previousSibling.tagName === 'BR' && editor.node.isElement(last_marker.parentNode) && editor.node.isElement(first_marker.parentNode)) {
        editor.$el.append('<br>');
      }

      restore();
    }

    function setAtStart(node, deep) {
      if (!node || node.getElementsByClassName('fr-marker').length > 0) {
        return false;
      }

      var child = node.firstChild;

      while (child && (editor.node.isBlock(child) || deep && !editor.node.isVoid(child) && child.nodeType === Node.ELEMENT_NODE)) {
        node = child;
        child = child.firstChild;
      }

      node.innerHTML = FroalaEditor.MARKERS + node.innerHTML;
    }

    function setAtEnd(node, deep) {
      if (!node || node.getElementsByClassName('fr-marker').length > 0) {
        return false;
      }

      var child = node.lastChild;

      while (child && (editor.node.isBlock(child) || deep && !editor.node.isVoid(child) && child.nodeType === Node.ELEMENT_NODE)) {
        node = child;
        child = child.lastChild;
      }

      var span = editor.doc.createElement('SPAN');
      span.setAttribute('id', 'fr-sel-markers');
      span.innerHTML = FroalaEditor.MARKERS; // https://github.com/froala/wysiwyg-editor/issues/3078

      while (node.parentNode && editor.opts.htmlAllowedEmptyTags && editor.opts.htmlAllowedEmptyTags.indexOf(node.tagName.toLowerCase()) >= 0) {
        node = node.parentNode;
      }

      node.appendChild(span);
      var nd = node.querySelector('#fr-sel-markers');
      nd.outerHTML = nd.innerHTML;
    }

    function setBefore(node, use_current_node) {
      if (typeof use_current_node === 'undefined') {
        use_current_node = true;
      } // Check if there is any previous sibling by skipping the empty text ones.


      var prev_node = node.previousSibling;

      while (prev_node && prev_node.nodeType === Node.TEXT_NODE && prev_node.textContent.length === 0) {
        prev_node = prev_node.previousSibling;
      } // There is a previous node.


      if (prev_node) {
        // Previous node is block so set the focus at the end of it.
        if (editor.node.isBlock(prev_node)) {
          setAtEnd(prev_node);
        } // Previous node is BR, so place markers before it.
        else if (prev_node.tagName === 'BR') {
            $(prev_node).before(FroalaEditor.MARKERS);
          } // Just place marker.
          else {
              $(prev_node).after(FroalaEditor.MARKERS);
            }

        return true;
      } // Use current node.
      else if (use_current_node) {
          // Current node is block, set selection at start.
          if (editor.node.isBlock(node)) {
            setAtStart(node);
          } // Just place markers.
          else {
              $(node).before(FroalaEditor.MARKERS);
            }

          return true;
        }

      return false;
    }

    function setAfter(node, use_current_node) {
      if (typeof use_current_node === 'undefined') {
        use_current_node = true;
      } // Check if there is any previous sibling by skipping the empty text ones.


      var next_node = node.nextSibling;

      while (next_node && next_node.nodeType === Node.TEXT_NODE && next_node.textContent.length === 0) {
        next_node = next_node.nextSibling;
      } // There is a next node.


      if (next_node) {
        // Next node is block so set the focus at the end of it.
        if (editor.node.isBlock(next_node)) {
          setAtStart(next_node);
        } // Just place marker.
        else {
            $(next_node).before(FroalaEditor.MARKERS);
          }

        return true;
      } // Use current node.
      else if (use_current_node) {
          // Current node is block, set selection at end.
          if (editor.node.isBlock(node)) {
            setAtEnd(node);
          } // Just place markers.
          else {
              $(node).after(FroalaEditor.MARKERS);
            }

          return true;
        }

      return false;
    }

    return {
      text: text,
      get: get,
      ranges: ranges,
      clear: clear,
      element: element,
      endElement: endElement,
      save: save,
      restore: restore,
      isCollapsed: isCollapsed,
      isFull: isFull,
      inEditor: inEditor,
      remove: remove,
      blocks: blocks,
      info: info,
      setAtEnd: setAtEnd,
      setAtStart: setAtStart,
      setBefore: setBefore,
      setAfter: setAfter,
      rangeElement: rangeElement
    };
  };

  Object.assign(FroalaEditor.DEFAULTS, {
    language: null
  });
  FroalaEditor.LANGUAGE = {};

  FroalaEditor.MODULES.language = function (editor) {
    var lang;
    /**
     * Translate.
     */

    function translate(str) {
      if (lang && lang.translation[str] && lang.translation[str].length) {
        return lang.translation[str];
      }

      return str;
    }
    /* Initialize */


    function _init() {
      // Load lang.
      if (FroalaEditor.LANGUAGE) {
        lang = FroalaEditor.LANGUAGE[editor.opts.language];
      } // Set direction.


      if (lang && lang.direction) {
        editor.opts.direction = lang.direction;
      }
    }

    return {
      _init: _init,
      translate: translate
    };
  };

  Object.assign(FroalaEditor.DEFAULTS, {
    placeholderText: 'Type something'
  });

  FroalaEditor.MODULES.placeholder = function (editor) {
    var $ = editor.$;
    /* Show placeholder. */

    function show() {
      if (!editor.$placeholder) {
        _add();
      }

      var margin_offset = editor.opts.iframe ? editor.$iframe.prev().outerHeight(true) : editor.$el.prev().outerHeight(true); // Determine the placeholder position based on the first element inside editor.

      var margin_top = 0;
      var margin_left = 0;
      var margin_right = 0;
      var padding_top = 0;
      var padding_left = 0;
      var padding_right = 0;
      var contents = editor.node.contents(editor.el);
      var alignment = $(editor.selection.element()).css('text-align');

      if (contents.length && contents[0].nodeType === Node.ELEMENT_NODE) {
        var $first_node = $(contents[0]);

        if ((editor.$wp.prev().length > 0 || editor.$el.prev().length > 0) && editor.ready) {
          margin_top = editor.helpers.getPX($first_node.css('margin-top'));
          padding_top = editor.helpers.getPX($first_node.css('padding-top'));
          margin_left = editor.helpers.getPX($first_node.css('margin-left'));
          margin_right = editor.helpers.getPX($first_node.css('margin-right'));
          padding_left = editor.helpers.getPX($first_node.css('padding-left'));
          padding_right = editor.helpers.getPX($first_node.css('padding-right'));
        }

        editor.$placeholder.css('font-size', $first_node.css('font-size'));
        editor.$placeholder.css('line-height', $first_node.css('line-height'));
      } else {
        editor.$placeholder.css('font-size', editor.$el.css('font-size'));
        editor.$placeholder.css('line-height', editor.$el.css('line-height'));
      }

      editor.$wp.addClass('show-placeholder');
      editor.$placeholder.css({
        marginTop: Math.max(editor.helpers.getPX(editor.$el.css('margin-top')), margin_top) + (margin_offset ? margin_offset : 0),
        paddingTop: Math.max(editor.helpers.getPX(editor.$el.css('padding-top')), padding_top),
        paddingLeft: Math.max(editor.helpers.getPX(editor.$el.css('padding-left')), padding_left),
        marginLeft: Math.max(editor.helpers.getPX(editor.$el.css('margin-left')), margin_left),
        paddingRight: Math.max(editor.helpers.getPX(editor.$el.css('padding-right')), padding_right),
        marginRight: Math.max(editor.helpers.getPX(editor.$el.css('margin-right')), margin_right),
        textAlign: alignment
      }).text(editor.language.translate(editor.opts.placeholderText || editor.$oel.attr('placeholder') || ''));
      editor.$placeholder.html(editor.$placeholder.text().replace(/\n/g, '<br>'));
    }
    /* Hide placeholder. */


    function hide() {
      editor.$wp.removeClass('show-placeholder');
    }
    /* Check if placeholder is visible */


    function isVisible() {
      return !editor.$wp ? true : editor.node.hasClass(editor.$wp.get(0), 'show-placeholder');
    }
    /* Refresh placeholder. */


    function refresh() {
      if (!editor.$wp) {
        return false;
      }

      if (editor.core.isEmpty()) {
        show();
      } else {
        hide();
      }
    }

    function _add() {
      editor.$placeholder = $(editor.doc.createElement('SPAN')).addClass('fr-placeholder');
      editor.$wp.append(editor.$placeholder);
    }
    /* Initialize. */


    function _init() {
      if (!editor.$wp) {
        return false;
      }

      editor.events.on('init input keydown keyup contentChanged initialized', refresh);
    }

    return {
      _init: _init,
      show: show,
      hide: hide,
      refresh: refresh,
      isVisible: isVisible
    };
  };

  FroalaEditor.UNICODE_NBSP = String.fromCharCode(160); // Void Elements http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements

  FroalaEditor.VOID_ELEMENTS = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'];
  FroalaEditor.BLOCK_TAGS = ['address', 'article', 'aside', 'audio', 'blockquote', 'canvas', 'details', 'dd', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'li', 'main', 'nav', 'noscript', 'ol', 'output', 'p', 'pre', 'section', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul', 'video']; // Extend defaults.

  Object.assign(FroalaEditor.DEFAULTS, {
    htmlAllowedEmptyTags: ['textarea', 'a', 'iframe', 'object', 'video', 'style', 'script', '.fa', '.fr-emoticon', '.fr-inner', 'path', 'line', 'hr'],
    htmlDoNotWrapTags: ['script', 'style'],
    htmlSimpleAmpersand: false,
    htmlIgnoreCSSProperties: [],
    htmlExecuteScripts: true
  });

  FroalaEditor.MODULES.html = function (editor) {
    var $ = editor.$;
    /**
     * Determine the default block tag.
     */

    function defaultTag() {
      if (editor.opts.enter === FroalaEditor.ENTER_P) {
        return 'p';
      }

      if (editor.opts.enter === FroalaEditor.ENTER_DIV) {
        return 'div';
      }

      if (editor.opts.enter === FroalaEditor.ENTER_BR) {
        return null;
      }
    }
    /**
     * Tells if the node keeps text formating.
     */


    function isPreformatted(node, look_up) {
      // Stop condition.
      if (!node || node === editor.el) {
        return false;
      } // Check only first level.


      if (!look_up) {
        // Is preformatted.
        return ['PRE', 'SCRIPT', 'STYLE'].indexOf(node.tagName) !== -1;
      } else {
        if (['PRE', 'SCRIPT', 'STYLE'].indexOf(node.tagName) != -1) {
          return true;
        }

        return isPreformatted(node.parentNode, look_up);
      }
    }
    /**
     * Get the empty blocs.
     */


    function emptyBlocks(around_markers) {
      var empty_blocks = [];
      var i; // Block tag elements.

      var els = [];

      if (around_markers) {
        var markers = editor.el.querySelectorAll('.fr-marker');

        for (i = 0; i < markers.length; i++) {
          var p_node = editor.node.blockParent(markers[i]) || markers[i];

          if (p_node) {
            var next_node = p_node.nextSibling;
            var prev_node = p_node.previousSibling; // Push current node, prev and next one.

            if (p_node && els.indexOf(p_node) < 0 && editor.node.isBlock(p_node)) {
              els.push(p_node);
            }

            if (prev_node && editor.node.isBlock(prev_node) && els.indexOf(prev_node) < 0) {
              els.push(prev_node);
            }

            if (next_node && editor.node.isBlock(next_node) && els.indexOf(next_node) < 0) {
              els.push(next_node);
            }
          }
        }
      } else {
        els = editor.el.querySelectorAll(blockTagsQuery());
      }

      var qr = blockTagsQuery();
      qr += ",".concat(FroalaEditor.VOID_ELEMENTS.join(','));
      qr += ', .fr-inner';
      qr += ",".concat(editor.opts.htmlAllowedEmptyTags.join(':not(.fr-marker),'), ":not(.fr-marker)"); // Check if there are empty block tags with markers.

      for (i = els.length - 1; i >= 0; i--) {
        // If the block tag has text content, ignore it.
        if (els[i].textContent && els[i].textContent.replace(/\u200B|\n/g, '').length > 0) {
          continue;
        }

        if (els[i].querySelectorAll(qr).length > 0) {
          continue;
        } // We're checking text from here on.


        var contents = editor.node.contents(els[i]);
        var found = false;

        for (var j = 0; j < contents.length; j++) {
          if (contents[j].nodeType === Node.COMMENT_NODE) {
            continue;
          } // Text node that is not empty.


          if (contents[j].textContent && contents[j].textContent.replace(/\u200B|\n/g, '').length > 0) {
            found = true;
            break;
          }
        } // Make sure we don't add TABLE and TD at the same time for instance.


        if (!found) {
          empty_blocks.push(els[i]);
        }
      }

      return empty_blocks;
    }
    /**
     * Create jQuery query for empty block tags.
     */


    function emptyBlockTagsQuery() {
      return "".concat(FroalaEditor.BLOCK_TAGS.join(':empty, '), ":empty");
    }
    /**
     * Create jQuery query for selecting block tags.
     */


    function blockTagsQuery() {
      return FroalaEditor.BLOCK_TAGS.join(', ');
    }
    /**
     * Remove empty elements that are not VOID elements.
     */


    function cleanEmptyTags(remove_blocks) {
      var els = $.merge([], FroalaEditor.VOID_ELEMENTS);
      els = $.merge(els, editor.opts.htmlAllowedEmptyTags);

      if (typeof remove_blocks === 'undefined') {
        els = $.merge(els, FroalaEditor.BLOCK_TAGS);
      } else {
        els = $.merge(els, FroalaEditor.NO_DELETE_TAGS);
      }

      var elms;
      var ok;
      elms = editor.el.querySelectorAll("*:empty:not(".concat(els.join('):not('), "):not(.fr-marker)"));

      do {
        ok = false; // Remove those elements that have no attributes.

        for (var i = 0; i < elms.length; i++) {
          if (elms[i].attributes.length === 0 || typeof elms[i].getAttribute('href') !== 'undefined') {
            elms[i].parentNode.removeChild(elms[i]);
            ok = true;
          }
        }

        elms = editor.el.querySelectorAll("*:empty:not(".concat(els.join('):not('), "):not(.fr-marker)"));
      } while (elms.length && ok);
    }
    /**
     * Wrap the content inside the element passed as argument.
     */


    function _wrapElement(el, temp) {
      var default_tag = defaultTag();

      if (temp) {
        default_tag = 'div';
      }

      if (default_tag) {
        // Rewrite the entire content.
        var main_doc = editor.doc.createDocumentFragment(); // Anchor.

        var anchor = null; // If we found anything inside the current anchor.

        var found = false;
        var node = el.firstChild;
        var changed = false; // Loop through contents.

        while (node) {
          var next_node = node.nextSibling; // Current node is a block node.
          // Or it is a do not wrap node and not a fr-marker.

          if (node.nodeType === Node.ELEMENT_NODE && (editor.node.isBlock(node) || editor.opts.htmlDoNotWrapTags.indexOf(node.tagName.toLowerCase()) >= 0 && !editor.node.hasClass(node, 'fr-marker'))) {
            anchor = null;
            main_doc.appendChild(node.cloneNode(true));
          } // Other node types than element and text.
          else if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.TEXT_NODE) {
              anchor = null;
              main_doc.appendChild(node.cloneNode(true));
            } // Current node is BR.
            else if (node.tagName === 'BR') {
                // There is no anchor.
                if (anchor === null) {
                  anchor = editor.doc.createElement(default_tag);
                  changed = true;

                  if (temp) {
                    anchor.setAttribute('class', 'fr-temp-div');
                    anchor.setAttribute('data-empty', true);
                  }

                  anchor.appendChild(node.cloneNode(true));
                  main_doc.appendChild(anchor);
                } // There is anchor. Just remove BR.
                // There is nothing else except markers and BR inside the new formed tag.
                else if (found === false) {
                    anchor.appendChild(editor.doc.createElement('br'));

                    if (temp) {
                      anchor.setAttribute('class', 'fr-temp-div');
                      anchor.setAttribute('data-empty', true);
                    }
                  }

                anchor = null;
              } // Text node or other node type.
              else {
                  var txt = node.textContent; // Node is not text node.
                  // Node is text node and it doesn't contain only spaces and NL.
                  // There are empty spaces but no new lines.

                  if (node.nodeType !== Node.TEXT_NODE || txt.replace(/\n/g, '').replace(/(^ *)|( *$)/g, '').length > 0 || txt.replace(/(^ *)|( *$)/g, '').length && txt.indexOf('\n') < 0) {
                    // No anchor.
                    if (anchor === null) {
                      anchor = editor.doc.createElement(default_tag);
                      changed = true;

                      if (temp) {
                        anchor.setAttribute('class', 'fr-temp-div');
                      }

                      main_doc.appendChild(anchor);
                      found = false;
                    } // Add node to anchor.


                    anchor.appendChild(node.cloneNode(true)); // Check if maybe we have a non empty node.

                    if (!found && !editor.node.hasClass(node, 'fr-marker') && !(node.nodeType === Node.TEXT_NODE && txt.replace(/ /g, '').length === 0)) {
                      found = true;
                    }
                  } else {
                    changed = true;
                  } // Else skip the node because it's empty.

                }

          node = next_node;
        }

        if (changed) {
          el.innerHTML = '';
          el.appendChild(main_doc);
        }
      }
    }

    function _wrapElements(els, temp) {
      for (var i = els.length - 1; i >= 0; i--) {
        _wrapElement(els[i], temp);
      }
    }
    /**
     * Wrap the direct content inside the default block tag.
     */


    function _wrap(temp, tables, blockquote, inner, li) {
      if (!editor.$wp) {
        return false;
      }

      if (typeof temp === 'undefined') {
        temp = false;
      }

      if (typeof tables === 'undefined') {
        tables = false;
      }

      if (typeof blockquote === 'undefined') {
        blockquote = false;
      }

      if (typeof inner === 'undefined') {
        inner = false;
      }

      if (typeof li === 'undefined') {
        li = false;
      } // Wrap element.


      var wp_st = editor.$wp.scrollTop();

      _wrapElement(editor.el, temp);

      if (inner) {
        _wrapElements(editor.el.querySelectorAll('.fr-inner'), temp);
      } // Wrap table contents.


      if (tables) {
        _wrapElements(editor.el.querySelectorAll('td, th'), temp);
      } // Wrap table contents.


      if (blockquote) {
        _wrapElements(editor.el.querySelectorAll('blockquote'), temp);
      }

      if (li) {
        _wrapElements(editor.el.querySelectorAll('li'), temp);
      }

      if (wp_st !== editor.$wp.scrollTop()) {
        editor.$wp.scrollTop(wp_st);
      }
    }
    /**
     * Unwrap temporary divs.
     */


    function unwrap() {
      editor.$el.find('div.fr-temp-div').each(function () {
        if (this.previousSibling && this.previousSibling.nodeType === Node.TEXT_NODE) {
          $(this).before('<br>');
        }

        if ($(this).attr('data-empty') || !this.nextSibling || editor.node.isBlock(this.nextSibling) && !$(this.nextSibling).hasClass('fr-temp-div')) {
          $(this).replaceWith($(this).html());
        } else {
          $(this).replaceWith("".concat($(this).html(), "<br>"));
        }
      }); // Remove temp class from other blocks.

      editor.$el.find('.fr-temp-div').removeClass('fr-temp-div').filter(function () {
        return $(this).attr('class') === '';
      }).removeAttr('class');
    }
    /**
     * Add BR inside empty elements.
     */


    function fillEmptyBlocks(around_markers) {
      var blocks = emptyBlocks(around_markers);

      if (editor.node.isEmpty(editor.el) && editor.opts.enter === FroalaEditor.ENTER_BR) {
        blocks.push(editor.el);
      }

      for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i];

        if (block.getAttribute('contenteditable') !== 'false' && !block.querySelector("".concat(editor.opts.htmlAllowedEmptyTags.join(':not(.fr-marker),'), ":not(.fr-marker)")) && !editor.node.isVoid(block)) {
          if (block.tagName !== 'TABLE' && block.tagName !== 'TBODY' && block.tagName !== 'TR' && block.tagName !== 'UL' && block.tagName !== 'OL') {
            block.appendChild(editor.doc.createElement('br'));
          }
        }
      } // Fix for https://github.com/froala/wysiwyg-editor/issues/1166#issuecomment-204549406.


      if (editor.browser.msie && editor.opts.enter === FroalaEditor.ENTER_BR) {
        var contents = editor.node.contents(editor.el);

        if (contents.length && contents[contents.length - 1].nodeType === Node.TEXT_NODE) {
          editor.$el.append('<br>');
        }
      }
    }
    /**
     * Get the blocks inside the editable area.
     */


    function blocks() {
      return editor.$el.get(0).querySelectorAll(blockTagsQuery());
    }
    /**
     * Clean the blank spaces between the block tags.
     */


    function cleanBlankSpaces(el) {
      if (typeof el === 'undefined') {
        el = editor.el;
      }

      if (el && ['SCRIPT', 'STYLE', 'PRE'].indexOf(el.tagName) >= 0) {
        return false;
      }

      var walker = editor.doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, editor.node.filter(function (node) {
        return node.textContent.match(/([ \n]{2,})|(^[ \n]{1,})|([ \n]{1,}$)/g) !== null;
      }), false);

      while (walker.nextNode()) {
        var node = walker.currentNode;

        if (isPreformatted(node.parentNode, true)) {
          continue;
        }

        var is_block_or_element = editor.node.isBlock(node.parentNode) || editor.node.isElement(node.parentNode); // Remove middle spaces.
        // Replace new lines with spaces.
        // Replace begin/end spaces.

        var txt = node.textContent.replace(/(?!^)( ){2,}(?!$)/g, ' ').replace(/\n/g, ' ').replace(/^[ ]{2,}/g, ' ').replace(/[ ]{2,}$/g, ' ');

        if (is_block_or_element) {
          var p_node = node.previousSibling;
          var n_node = node.nextSibling;

          if (p_node && n_node && txt === ' ') {
            if (editor.node.isBlock(p_node) && editor.node.isBlock(n_node)) {
              txt = '';
            } else {
              txt = ' ';
            }
          } else {
            // No previous siblings.
            if (!p_node) {
              txt = txt.replace(/^ */, '');
            } // No next siblings.


            if (!n_node) {
              txt = txt.replace(/ *$/, '');
            }
          }
        }

        node.textContent = txt;
      }
    }
    /**
     * Extract a specific match for a RegEx.
     */


    function _extractMatch(html, re, id) {
      var reg_exp = new RegExp(re, 'gi');
      var matches = reg_exp.exec(html);

      if (matches) {
        return matches[id];
      }

      return null;
    }
    /**
     * Create new doctype.
     */


    function _newDoctype(string, doc) {
      var matches = string.match(/<!DOCTYPE ?([^ ]*) ?([^ ]*) ?"?([^"]*)"? ?"?([^"]*)"?>/i);

      if (matches) {
        return doc.implementation.createDocumentType(matches[1], matches[3], matches[4]);
      }

      return doc.implementation.createDocumentType('html');
    }
    /**
     * Get string doctype of a document.
     */


    function getDoctype(doc) {
      var node = doc.doctype;
      var doctype = '<!DOCTYPE html>';

      if (node) {
        doctype = "<!DOCTYPE ".concat(node.name).concat(node.publicId ? " PUBLIC \"".concat(node.publicId, "\"") : '').concat(!node.publicId && node.systemId ? ' SYSTEM' : '').concat(node.systemId ? " \"".concat(node.systemId, "\"") : '', ">");
      }

      return doctype;
    }

    function _processBR(br) {
      var parent_node = br.parentNode;

      if (parent_node && (editor.node.isBlock(parent_node) || editor.node.isElement(parent_node)) && ['TD', 'TH'].indexOf(parent_node.tagName) < 0) {
        var prev_node = br.previousSibling;
        var next_node = br.nextSibling; // Ignore non characters.

        while (prev_node && (prev_node.nodeType === Node.TEXT_NODE && prev_node.textContent.replace(/\n|\r/g, '').length === 0 || editor.node.hasClass(prev_node, 'fr-tmp'))) {
          prev_node = prev_node.previousSibling;
        }

        if (next_node) {
          return false;
        } // Previous node.
        // Previous node is not BR.
        // Previoues node is not block tag.
        // No next node.
        // Parent node has text.
        // Previous node has text.


        if (prev_node && parent_node && prev_node.tagName !== 'BR' && !editor.node.isBlock(prev_node) && !next_node && parent_node.textContent.replace(/\u200B/g, '').length > 0 && prev_node.textContent.length > 0 && !editor.node.hasClass(prev_node, 'fr-marker')) {
          // Fix for https://github.com/froala/wysiwyg-editor/issues/1166#issuecomment-204549406.
          if (!(editor.el === parent_node && !next_node && editor.opts.enter === FroalaEditor.ENTER_BR && editor.browser.msie)) {
            br.parentNode.removeChild(br);
          }
        }
      } // Regular node.
      else if (parent_node && !(editor.node.isBlock(parent_node) || editor.node.isElement(parent_node))) {
          // Check if we have something else than BR.
          if (!br.previousSibling && !br.nextSibling && editor.node.isDeletable(br.parentNode)) {
            _processBR(br.parentNode);
          }
        }
    }

    function cleanBRs() {
      var brs = editor.el.getElementsByTagName('br');

      for (var i = 0; i < brs.length; i++) {
        _processBR(brs[i]);
      }
    }
    /**
     * Normalize.
     */


    function _normalize() {
      if (!editor.opts.htmlUntouched) {
        // Remove empty tags.
        cleanEmptyTags(); // Wrap possible text.

        _wrap(); // Clean blank spaces.


        cleanBlankSpaces(); // Normalize spaces.

        editor.spaces.normalize(null, true); // Add BR tag where it is necessary.

        editor.html.fillEmptyBlocks(); // Clean lists.

        editor.clean.lists(); // Clean tables.

        editor.clean.tables(); // Convert to HTML5.

        editor.clean.toHTML5(); // Remove unecessary brs.

        editor.html.cleanBRs();
      } // Restore selection.


      editor.selection.restore(); // Check if editor is empty and add placeholder.

      checkIfEmpty(); // Refresh placeholder.

      editor.placeholder.refresh();
    }

    function checkIfEmpty() {
      if (editor.node.isEmpty(editor.el)) {
        if (defaultTag() !== null) {
          // There is no block tag inside the editor.
          if (!editor.el.querySelector(blockTagsQuery()) && !editor.el.querySelector("".concat(editor.opts.htmlDoNotWrapTags.join(':not(.fr-marker),'), ":not(.fr-marker)"))) {
            if (editor.core.hasFocus()) {
              editor.$el.html("<".concat(defaultTag(), ">").concat(FroalaEditor.MARKERS, "<br/></").concat(defaultTag(), ">"));
              editor.selection.restore();
            } else {
              editor.$el.html("<".concat(defaultTag(), "><br/></").concat(defaultTag(), ">"));
            }
          }
        } else {
          // There is nothing in the editor.
          if (!editor.el.querySelector('*:not(.fr-marker):not(br)')) {
            if (editor.core.hasFocus()) {
              editor.$el.html("".concat(FroalaEditor.MARKERS, "<br/>"));
              editor.selection.restore();
            } else {
              editor.$el.html('<br/>');
            }
          }
        }
      }
    }

    function extractNode(html, tag) {
      return _extractMatch(html, "<".concat(tag, "[^>]*?>([\\w\\W]*)</").concat(tag, ">"), 1);
    }

    function extractNodeAttrs(html, tag) {
      var $dv = $("<div ".concat(_extractMatch(html, "<".concat(tag, "([^>]*?)>"), 1) || '', ">"));
      return editor.node.rawAttributes($dv.get(0));
    }

    function extractDoctype(html) {
      return (_extractMatch(html, '<!DOCTYPE([^>]*?)>', 0) || '<!DOCTYPE html>').replace(/\n/g, ' ').replace(/ {2,}/g, ' ');
    }
    /*
     * Set html to node.
     */


    function _setHtml($node, html) {
      if (editor.opts.htmlExecuteScripts) {
        $node.html(html);
      } else {
        $node.get(0).innerHTML = html;
      }
    }
    /**
     * Set HTML.
     */


    function set(html) {
      var clean_html = editor.clean.html((html || '').trim(), [], [], editor.opts.fullPage);

      if (!editor.opts.fullPage) {
        _setHtml(editor.$el, clean_html);
      } else {
        // Get BODY data.
        var body_html = extractNode(clean_html, 'body') || (clean_html.indexOf('<body') >= 0 ? '' : clean_html);
        var body_attrs = extractNodeAttrs(clean_html, 'body'); // Get HEAD data.

        var head_html = extractNode(clean_html, 'head') || '<title></title>';
        var head_attrs = extractNodeAttrs(clean_html, 'head'); // Get HTML that might be in <head> other than meta tags.
        // https://github.com/froala/wysiwyg-editor/issues/1208

        var $dv = $('<div>');
        $dv.append(head_html).contents().each(function () {
          if (this.nodeType === Node.COMMENT_NODE || ['BASE', 'LINK', 'META', 'NOSCRIPT', 'SCRIPT', 'STYLE', 'TEMPLATE', 'TITLE'].indexOf(this.tagName) >= 0) {
            this.parentNode.removeChild(this);
          }
        });
        var head_bad_html = $dv.html().trim(); // Filter and keep only meta tags in <head>.
        // https://html.spec.whatwg.org/multipage/dom.html#metadata-content-2

        head_html = $('<div>').append(head_html).contents().map(function () {
          if (this.nodeType === Node.COMMENT_NODE) {
            return "<!--".concat(this.nodeValue, "-->");
          } else if (['BASE', 'LINK', 'META', 'NOSCRIPT', 'SCRIPT', 'STYLE', 'TEMPLATE', 'TITLE'].indexOf(this.tagName) >= 0) {
            return this.outerHTML;
          }

          return '';
        }).toArray().join(''); // Get DOCTYPE.

        var doctype = extractDoctype(clean_html); // Get HTML attributes.

        var html_attrs = extractNodeAttrs(clean_html, 'html');

        _setHtml(editor.$el, "".concat(head_bad_html, "\n").concat(body_html));

        editor.node.clearAttributes(editor.el);
        editor.$el.attr(body_attrs);
        editor.$el.addClass('fr-view');
        editor.$el.attr('spellcheck', editor.opts.spellcheck);
        editor.$el.attr('dir', editor.opts.direction);

        _setHtml(editor.$head, head_html);

        editor.node.clearAttributes(editor.$head.get(0));
        editor.$head.attr(head_attrs);
        editor.node.clearAttributes(editor.$html.get(0));
        editor.$html.attr(html_attrs);
        editor.iframe_document.doctype.parentNode.replaceChild(_newDoctype(doctype, editor.iframe_document), editor.iframe_document.doctype);
      } // Make sure the content is editable.


      var disabled = editor.edit.isDisabled();
      editor.edit.on();
      editor.core.injectStyle(editor.opts.iframeDefaultStyle + editor.opts.iframeStyle);

      _normalize();

      if (!editor.opts.useClasses) {
        // Restore orignal attributes if present.
        editor.$el.find('[fr-original-class]').each(function () {
          this.setAttribute('class', this.getAttribute('fr-original-class'));
          this.removeAttribute('fr-original-class');
        });
        editor.$el.find('[fr-original-style]').each(function () {
          this.setAttribute('style', this.getAttribute('fr-original-style'));
          this.removeAttribute('fr-original-style');
        });
      }

      if (disabled) {
        editor.edit.off();
      }

      editor.events.trigger('html.set');
    }

    function _specifity(selector) {
      var idRegex = /(#[^\s+>~.[:]+)/g;
      var attributeRegex = /(\[[^]]+\])/g;
      var classRegex = /(\.[^\s+>~.[:]+)/g;
      var pseudoElementRegex = /(::[^\s+>~.[:]+|:first-line|:first-letter|:before|:after)/gi;
      var pseudoClassWithBracketsRegex = /(:[\w-]+\([^)]*\))/gi; // A regex for other pseudo classes, which don't have brackets

      var pseudoClassRegex = /(:[^\s+>~.[:]+)/g;
      var elementRegex = /([^\s+>~.[:]+)/g; // Remove the negation psuedo-class (:not) but leave its argument because specificity is calculated on its argument

      (function () {
        var regex = /:not\(([^)]*)\)/g;

        if (regex.test(selector)) {
          selector = selector.replace(regex, '     $1 ');
        }
      })();

      var s = (selector.match(idRegex) || []).length * 100 + (selector.match(attributeRegex) || []).length * 10 + (selector.match(classRegex) || []).length * 10 + (selector.match(pseudoClassWithBracketsRegex) || []).length * 10 + (selector.match(pseudoClassRegex) || []).length * 10 + (selector.match(pseudoElementRegex) || []).length; // Remove universal selector and separator characters

      selector = selector.replace(/[*\s+>~]/g, ' '); // Remove any stray dots or hashes which aren't attached to words
      // These may be present if the user is live-editing this selector

      selector = selector.replace(/[#.]/g, ' ');
      s += (selector.match(elementRegex) || []).length;
      return s;
    }
    /**
     * Do processing on the final html.
     */


    function _processOnGet(el) {
      editor.events.trigger('html.processGet', [el]); // Remove class attribute when empty.

      if (el && el.getAttribute && el.getAttribute('class') === '') {
        el.removeAttribute('class');
      }

      if (el && el.getAttribute && el.getAttribute('style') === '') {
        el.removeAttribute('style');
      } // Look at inner nodes that have no class set.


      if (el && el.nodeType === Node.ELEMENT_NODE) {
        var els = el.querySelectorAll('[class=""],[style=""]');
        var i;

        for (i = 0; i < els.length; i++) {
          var _el = els[i];

          if (_el.getAttribute('class') === '') {
            _el.removeAttribute('class');
          }

          if (_el.getAttribute('style') === '') {
            _el.removeAttribute('style');
          }
        }

        if (el.tagName === 'BR') {
          _processBR(el);
        } else {
          var brs = el.querySelectorAll('br');

          for (i = 0; i < brs.length; i++) {
            _processBR(brs[i]);
          }
        }
      }
    }
    /**
     * Sort elements by spec.
     */


    function _sortElementsBySpec(a, b) {
      return a[3] - b[3];
    }
    /**
     * Get HTML.
     */


    function get(keep_markers, keep_classes) {
      if (!editor.$wp) {
        return editor.$oel.clone().removeClass('fr-view').removeAttr('contenteditable').get(0).outerHTML;
      }

      var html = '';
      editor.events.trigger('html.beforeGet'); // Convert STYLE from CSS files to inline style.

      var updated_elms = [];
      var elms_info = {};
      var i;
      var j;
      var elems_specs = []; // Sync inputs when getting the HTML.

      var inputs = editor.el.querySelectorAll('input, textarea');

      for (i = 0; i < inputs.length; i++) {
        inputs[i].setAttribute('value', inputs[i].value);
      }

      if (!editor.opts.useClasses && !keep_classes) {
        var ignoreRegEx = new RegExp("^".concat(editor.opts.htmlIgnoreCSSProperties.join('$|^'), "$"), 'gi');

        for (i = 0; i < editor.doc.styleSheets.length; i++) {
          var rules = void 0;
          var head_style = 0;

          try {
            rules = editor.doc.styleSheets[i].cssRules;

            if (editor.doc.styleSheets[i].ownerNode && editor.doc.styleSheets[i].ownerNode.nodeType === 'STYLE') {
              head_style = 1;
            }
          } catch (ex) {// keep empty.
          }

          if (rules) {
            for (var idx = 0, len = rules.length; idx < len; idx++) {
              if (rules[idx].selectorText) {
                if (rules[idx].style.cssText.length > 0) {
                  var selector = rules[idx].selectorText.replace(/body |\.fr-view /g, '').replace(/::/g, ':');
                  var elms = void 0;

                  try {
                    elms = editor.el.querySelectorAll(selector);
                  } catch (ex) {
                    elms = [];
                  }

                  for (j = 0; j < elms.length; j++) {
                    // Save original style.
                    if (!elms[j].getAttribute('fr-original-style') && elms[j].getAttribute('style')) {
                      elms[j].setAttribute('fr-original-style', elms[j].getAttribute('style'));
                      updated_elms.push(elms[j]);
                    } else if (!elms[j].getAttribute('fr-original-style')) {
                      elms[j].setAttribute('fr-original-style', '');
                      updated_elms.push(elms[j]);
                    }

                    if (!elms_info[elms[j]]) {
                      elms_info[elms[j]] = {};
                    } // Compute specification.


                    var spec = head_style * 1000 + _specifity(rules[idx].selectorText); // Get CSS text of the rule.


                    var css_text = rules[idx].style.cssText.split(';'); // Get each rule.

                    for (var k = 0; k < css_text.length; k++) {
                      // Rule.
                      var rule = css_text[k].trim().split(':')[0];

                      if (!rule) {
                        continue;
                      } // Ignore the CSS rules we don't need.


                      if (rule.match(ignoreRegEx)) {
                        continue;
                      }

                      if (!elms_info[elms[j]][rule]) {
                        elms_info[elms[j]][rule] = 0;

                        if ((elms[j].getAttribute('fr-original-style') || '').indexOf("".concat(rule, ":")) >= 0) {
                          elms_info[elms[j]][rule] = 10000;
                        }
                      } // Current spec is higher than the existing one.


                      if (spec >= elms_info[elms[j]][rule]) {
                        elms_info[elms[j]][rule] = spec;

                        if (css_text[k].trim().length) {
                          var info = css_text[k].trim().split(':');
                          info.splice(0, 1); // Add elements with css values and spec. This will be sorted later.

                          elems_specs.push([elms[j], rule.trim(), info.join(':').trim(), spec]);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } // Sort elements by spec.


        elems_specs.sort(_sortElementsBySpec); // Add style to elements in the order of specification.

        for (i = 0; i < elems_specs.length; i++) {
          var specs_elem = elems_specs[i];
          specs_elem[0].style[specs_elem[1]] = specs_elem[2];
        } // Save original class.


        for (i = 0; i < updated_elms.length; i++) {
          if (updated_elms[i].getAttribute('class')) {
            updated_elms[i].setAttribute('fr-original-class', updated_elms[i].getAttribute('class'));
            updated_elms[i].removeAttribute('class');
          } // Make sure that we have the inline style first.


          if ((updated_elms[i].getAttribute('fr-original-style') || '').trim().length > 0) {
            var original_rules = updated_elms[i].getAttribute('fr-original-style').split(';');

            for (j = 0; j < original_rules.length; j++) {
              if (original_rules[j].indexOf(':') > 0) {
                var splits = original_rules[j].split(':');
                var original_rule = splits[0];
                splits.splice(0, 1);
                updated_elms[i].style[original_rule.trim()] = splits.join(':').trim();
              }
            }
          }
        }
      } // If editor is not empty.


      if (!editor.node.isEmpty(editor.el)) {
        if (typeof keep_markers === 'undefined') {
          keep_markers = false;
        }

        if (!editor.opts.fullPage) {
          html = editor.$el.html();
        } else {
          html = getDoctype(editor.iframe_document);
          editor.$el.removeClass('fr-view');
          var heightMin = editor.opts.heightMin;
          var height = editor.opts.height;
          var heightMax = editor.opts.heightMax;
          editor.opts.heightMin = null;
          editor.opts.height = null;
          editor.opts.heightMax = null;
          editor.size.refresh();
          html += "<html".concat(editor.node.attributes(editor.$html.get(0)), ">").concat(editor.$html.html(), "</html>");
          editor.opts.heightMin = heightMin;
          editor.opts.height = height;
          editor.opts.heightMax = heightMax;
          editor.size.refresh();
          editor.$el.addClass('fr-view');
        }
      } else if (editor.opts.fullPage) {
        html = getDoctype(editor.iframe_document);
        html += "<html".concat(editor.node.attributes(editor.$html.get(0)), ">").concat(editor.$html.find('head').get(0).outerHTML, "<body></body></html>");
      } // Remove unwanted attributes.


      if (!editor.opts.useClasses && !keep_classes) {
        for (i = 0; i < updated_elms.length; i++) {
          if (updated_elms[i].getAttribute('fr-original-class')) {
            updated_elms[i].setAttribute('class', updated_elms[i].getAttribute('fr-original-class'));
            updated_elms[i].removeAttribute('fr-original-class');
          }

          if (updated_elms[i].getAttribute('fr-original-style') !== null && typeof updated_elms[i].getAttribute('fr-original-style') !== 'undefined') {
            if (updated_elms[i].getAttribute('fr-original-style').length !== 0) {
              updated_elms[i].setAttribute('style', updated_elms[i].getAttribute('fr-original-style'));
            } else {
              updated_elms[i].removeAttribute('style');
            }

            updated_elms[i].removeAttribute('fr-original-style');
          } else {
            updated_elms[i].removeAttribute('style');
          }
        }
      } // Clean helpers.


      if (editor.opts.fullPage) {
        html = html.replace(/<style data-fr-style="true">(?:[\w\W]*?)<\/style>/g, '');
        html = html.replace(/<link([^>]*)data-fr-style="true"([^>]*)>/g, '');
        html = html.replace(/<style(?:[\w\W]*?)class="firebugResetStyles"(?:[\w\W]*?)>(?:[\w\W]*?)<\/style>/g, '');
        html = html.replace(/<body((?:[\w\W]*?)) spellcheck="true"((?:[\w\W]*?))>((?:[\w\W]*?))<\/body>/g, '<body$1$2>$3</body>');
        html = html.replace(/<body((?:[\w\W]*?)) contenteditable="(true|false)"((?:[\w\W]*?))>((?:[\w\W]*?))<\/body>/g, '<body$1$3>$4</body>');
        html = html.replace(/<body((?:[\w\W]*?)) dir="([\w]*)"((?:[\w\W]*?))>((?:[\w\W]*?))<\/body>/g, '<body$1$3>$4</body>');
        html = html.replace(/<body((?:[\w\W]*?))class="([\w\W]*?)(fr-rtl|fr-ltr)([\w\W]*?)"((?:[\w\W]*?))>((?:[\w\W]*?))<\/body>/g, '<body$1class="$2$4"$5>$6</body>');
        html = html.replace(/<body((?:[\w\W]*?)) class=""((?:[\w\W]*?))>((?:[\w\W]*?))<\/body>/g, '<body$1$2>$3</body>');
      } // Ampersand fix.


      if (editor.opts.htmlSimpleAmpersand) {
        html = html.replace(/&amp;/gi, '&');
      }

      editor.events.trigger('html.afterGet'); // Remove markers.

      if (!keep_markers) {
        html = html.replace(/<span[^>]*? class\s*=\s*["']?fr-marker["']?[^>]+>\u200b<\/span>/gi, '');
      }

      html = editor.clean.invisibleSpaces(html);
      html = editor.clean.exec(html, _processOnGet);
      var new_html = editor.events.chainTrigger('html.get', html);

      if (typeof new_html === 'string') {
        html = new_html;
      } // Deal with pre.


      html = html.replace(/<pre(?:[\w\W]*?)>(?:[\w\W]*?)<\/pre>/g, function (str) {
        return str.replace(/<br>/g, '\n');
      }); // Keep META.

      html = html.replace(/<meta((?:[\w\W]*?)) data-fr-http-equiv="/g, '<meta$1 http-equiv="');
      return html;
    }
    /**
     * Get selected HTML.
     */


    function getSelected() {
      function wrapSelection(container, node) {
        while (node && (node.nodeType === Node.TEXT_NODE || !editor.node.isBlock(node)) && !editor.node.isElement(node) && !editor.node.hasClass(node, 'fr-inner')) {
          if (node && node.nodeType !== Node.TEXT_NODE) {
            $(container).wrapInner(editor.node.openTagString(node) + editor.node.closeTagString(node));
          }

          node = node.parentNode;
        } // else if is for https://github.com/froala/wysiwyg-editor/issues/3352


        if (node && container.innerHTML === node.innerHTML) {
          container.innerHTML = node.outerHTML;
        } else if (node.innerText.indexOf(container.innerHTML) != -1) {
          container.innerHTML = editor.node.openTagString(node) + node.innerHTML + editor.node.closeTagString(node);
        }
      }

      function selectionParent() {
        var parent = null;
        var sel;

        if (editor.win.getSelection) {
          sel = editor.win.getSelection();

          if (sel && sel.rangeCount) {
            parent = sel.getRangeAt(0).commonAncestorContainer;

            if (parent.nodeType !== Node.ELEMENT_NODE) {
              parent = parent.parentNode;
            }
          }
        } else if ((sel = editor.doc.selection) && sel.type !== 'Control') {
          parent = sel.createRange().parentElement();
        }

        if (parent !== null && ($(parent).parents().toArray().indexOf(editor.el) >= 0 || parent === editor.el)) {
          return parent;
        }

        return null;
      }

      var html = '';

      if (typeof editor.win.getSelection !== 'undefined') {
        // Multiple ranges hack.
        if (editor.browser.mozilla) {
          editor.selection.save();

          if (editor.$el.find('.fr-marker[data-type="false"]').length > 1) {
            editor.$el.find('.fr-marker[data-type="false"][data-id="0"]').remove();
            editor.$el.find('.fr-marker[data-type="false"]:last').attr('data-id', '0');
            editor.$el.find('.fr-marker').not('[data-id="0"]').remove();
          }

          editor.selection.restore();
        }

        var ranges = editor.selection.ranges();

        for (var i = 0; i < ranges.length; i++) {
          var container = document.createElement('div');
          container.appendChild(ranges[i].cloneContents());
          wrapSelection(container, selectionParent()); // Fix for https://github.com/froala/wysiwyg-editor/issues/1010.

          if ($(container).find('.fr-element').length > 0) {
            container = editor.el;
          }

          html += container.innerHTML;
        }
      } else if (typeof editor.doc.selection !== 'undefined') {
        if (editor.doc.selection.type === 'Text') {
          html = editor.doc.selection.createRange().htmlText;
        }
      }

      return html;
    }

    function _hasBlockTags(html) {
      var tmp = editor.doc.createElement('div');
      tmp.innerHTML = html;
      return tmp.querySelector(blockTagsQuery()) !== null;
    }

    function _setCursorAtEnd(html) {
      var tmp = editor.doc.createElement('div');
      tmp.innerHTML = html;
      editor.selection.setAtEnd(tmp, true);
      return tmp.innerHTML;
    }

    function escapeEntities(str) {
      return str.replace(/</gi, '&lt;').replace(/>/gi, '&gt;').replace(/"/gi, '&quot;').replace(/'/gi, '&#39;');
    }

    function _unwrapForLists(html) {
      if (!editor.html.defaultTag()) {
        return html;
      }

      var tmp = editor.doc.createElement('div');
      tmp.innerHTML = html; // https://github.com/froala/wysiwyg-editor/issues/1553. Unwrap default tags from lists.

      var default_tag_els = tmp.querySelectorAll(":scope > ".concat(editor.html.defaultTag()));

      for (var i = default_tag_els.length - 1; i >= 0; i--) {
        var el = default_tag_els[i];

        if (!editor.node.isBlock(el.previousSibling)) {
          // Check previous sibling in order to add br.
          if (el.previousSibling && !editor.node.isEmpty(el)) {
            $('<br>').insertAfter(el.previousSibling);
          } // Unwrap.


          el.outerHTML = el.innerHTML;
        }
      }

      return tmp.innerHTML;
    }
    /**
     * Insert HTML.
     */


    function insert(dirty_html, clean, do_split) {
      // There is no selection.
      if (!editor.selection.isCollapsed()) {
        editor.selection.remove();
      }

      var clean_html;

      if (!clean) {
        clean_html = editor.clean.html(dirty_html);
      } else {
        clean_html = dirty_html;
      }

      if (dirty_html.indexOf('class="fr-marker"') < 0) {
        clean_html = _setCursorAtEnd(clean_html);
      } // Editor is empty and there are block tags in the pasted HTML.


      if (editor.node.isEmpty(editor.el) && !editor.opts.keepFormatOnDelete && _hasBlockTags(clean_html)) {
        editor.el.innerHTML = clean_html;
      } else {
        // Insert a marker.
        var marker = editor.markers.insert();

        if (!marker) {
          editor.el.innerHTML += clean_html;
        } else {
          // Do not insert html inside emoticon.
          if (editor.node.isLastSibling(marker) && $(marker).parent().hasClass('fr-deletable')) {
            $(marker).insertAfter($(marker).parent());
          } // Check if HTML contains block tags and if so then break the current HTML.


          var block_parent = editor.node.blockParent(marker);

          if ((_hasBlockTags(clean_html) || do_split) && (editor.node.deepestParent(marker) || block_parent && block_parent.tagName === 'LI')) {
            if (block_parent && block_parent.tagName === 'LI') {
              clean_html = _unwrapForLists(clean_html);
            }

            marker = editor.markers.split();

            if (!marker) {
              return false;
            }

            marker.outerHTML = clean_html;
          } else {
            marker.outerHTML = clean_html;
          }
        }
      }

      _normalize();

      editor.keys.positionCaret();
      editor.events.trigger('html.inserted');
    }
    /**
     * Clean those tags that have an invisible space inside.
     */


    function cleanWhiteTags(ignore_selection) {
      var current_el = null;

      if (typeof ignore_selection === 'undefined') {
        current_el = editor.selection.element();
      }

      if (editor.opts.keepFormatOnDelete) {
        return false;
      }

      var current_white = current_el ? (current_el.textContent.match(/\u200B/g) || []).length - current_el.querySelectorAll('.fr-marker').length : 0;
      var total_white = (editor.el.textContent.match(/\u200B/g) || []).length - editor.el.querySelectorAll('.fr-marker').length;

      if (total_white === current_white) {
        return false;
      }

      var possible_elements;
      var removed;

      do {
        removed = false;
        possible_elements = editor.el.querySelectorAll('*:not(.fr-marker)');

        for (var i = 0; i < possible_elements.length; i++) {
          var el = possible_elements[i];

          if (current_el === el) {
            continue;
          }

          var text = el.textContent;

          if (el.children.length === 0 && text.length === 1 && text.charCodeAt(0) === 8203 && el.tagName !== 'TD') {
            $(el).remove();
            removed = true;
          }
        }
      } while (removed);
    }

    function _cleanTags() {
      cleanWhiteTags();

      if (editor.placeholder) {
        setTimeout(editor.placeholder.refresh, 0);
      }
    }
    /**
     * Initialization.
     */


    function _init() {
      if (editor.$wp) {
        editor.events.on('mouseup', _cleanTags);
        editor.events.on('keydown', _cleanTags);
        editor.events.on('contentChanged', checkIfEmpty);
      }
    }

    return {
      defaultTag: defaultTag,
      isPreformatted: isPreformatted,
      emptyBlocks: emptyBlocks,
      emptyBlockTagsQuery: emptyBlockTagsQuery,
      blockTagsQuery: blockTagsQuery,
      fillEmptyBlocks: fillEmptyBlocks,
      cleanEmptyTags: cleanEmptyTags,
      cleanWhiteTags: cleanWhiteTags,
      cleanBlankSpaces: cleanBlankSpaces,
      blocks: blocks,
      getDoctype: getDoctype,
      set: set,
      get: get,
      getSelected: getSelected,
      insert: insert,
      wrap: _wrap,
      unwrap: unwrap,
      escapeEntities: escapeEntities,
      checkIfEmpty: checkIfEmpty,
      extractNode: extractNode,
      extractNodeAttrs: extractNodeAttrs,
      extractDoctype: extractDoctype,
      cleanBRs: cleanBRs,
      _init: _init
    };
  };

  FroalaEditor.ENTER_P = 0;
  FroalaEditor.ENTER_DIV = 1;
  FroalaEditor.ENTER_BR = 2;
  FroalaEditor.KEYCODE = {
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    ESC: 27,
    SPACE: 32,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,
    DELETE: 46,
    ZERO: 48,
    ONE: 49,
    TWO: 50,
    THREE: 51,
    FOUR: 52,
    FIVE: 53,
    SIX: 54,
    SEVEN: 55,
    EIGHT: 56,
    NINE: 57,
    FF_SEMICOLON: 59,
    // Firefox (Gecko) fires this for semicolon instead of 186
    FF_EQUALS: 61,
    // Firefox (Gecko) fires this for equals instead of 187
    QUESTION_MARK: 63,
    // needs localization
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    META: 91,
    NUM_ZERO: 96,
    NUM_ONE: 97,
    NUM_TWO: 98,
    NUM_THREE: 99,
    NUM_FOUR: 100,
    NUM_FIVE: 101,
    NUM_SIX: 102,
    NUM_SEVEN: 103,
    NUM_EIGHT: 104,
    NUM_NINE: 105,
    NUM_MULTIPLY: 106,
    NUM_PLUS: 107,
    NUM_MINUS: 109,
    NUM_PERIOD: 110,
    NUM_DIVISION: 111,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    FF_HYPHEN: 173,
    // Firefox (Gecko) fires this for hyphen instead of 189s
    SEMICOLON: 186,
    // needs localization
    DASH: 189,
    // needs localization
    EQUALS: 187,
    // needs localization
    COMMA: 188,
    // needs localization
    HYPHEN: 189,
    // needs localization
    PERIOD: 190,
    // needs localization
    SLASH: 191,
    // needs localization
    APOSTROPHE: 192,
    // needs localization
    TILDE: 192,
    // needs localization
    SINGLE_QUOTE: 222,
    // needs localization
    OPEN_SQUARE_BRACKET: 219,
    // needs localization
    BACKSLASH: 220,
    // needs localization
    CLOSE_SQUARE_BRACKET: 221,
    // needs localization
    IME: 229 // Extend defaults.

  };
  Object.assign(FroalaEditor.DEFAULTS, {
    enter: FroalaEditor.ENTER_P,
    multiLine: true,
    tabSpaces: 0
  });

  FroalaEditor.MODULES.keys = function (editor) {
    var $ = editor.$;
    var IME = false;
    /**
     * ENTER.
     */

    function _enter(e) {
      if (!editor.opts.multiLine) {
        e.preventDefault();
        e.stopPropagation();
      } // Not iOS.
      else {
          // Do not prevent default on IOS.
          if (!editor.helpers.isIOS()) {
            e.preventDefault();
            e.stopPropagation();
          }

          if (!editor.selection.isCollapsed()) {
            editor.selection.remove();
          }

          editor.cursor.enter();
        }
    }
    /**
     * SHIFT ENTER.
     */


    function _shiftEnter(e) {
      e.preventDefault();
      e.stopPropagation();

      if (editor.opts.multiLine) {
        if (!editor.selection.isCollapsed()) {
          editor.selection.remove();
        }

        editor.cursor.enter(true);
      }
    }
    /**
     * Control/Command Backspace.
     */


    function _ctlBackspace() {
      setTimeout(function () {
        editor.events.disableBlur();
        editor.events.focus();
      }, 0);
    }
    /**
     * BACKSPACE.
     */


    function _backspace(e) {
      // There is no selection.
      if (editor.selection.isCollapsed()) {
        editor.cursor.backspace();

        if (editor.helpers.isIOS()) {
          var range = editor.selection.ranges(0);
          range.deleteContents();
          range.insertNode(document.createTextNode("\u200B"));
          var sel = editor.selection.get();
          sel.modify('move', 'forward', 'character');
        } else {
          e.preventDefault();
          e.stopPropagation();
        }
      } // We have text selected.
      else {
          e.preventDefault();
          e.stopPropagation();
          editor.selection.remove();
        }

      editor.placeholder.refresh();
    }
    /**
     * DELETE
     */


    function _del(e) {
      e.preventDefault();
      e.stopPropagation(); // There is no selection or only image selection.
      // https://github.com/froala/wysiwyg-editor/issues/3342

      if (editor.selection.text() === '' && editor.selection.element().tagName != 'IMG') {
        editor.cursor.del();
      } // We have text selected.
      else {
          editor.selection.remove();
        }

      editor.placeholder.refresh();
    }
    /**
     * SPACE
     */


    function _space(e) {
      var el = editor.selection.element(); // Do nothing on mobile.
      // Browser is Mozilla or we're inside a link tag.

      if (!editor.helpers.isMobile() && el && el.tagName === 'A') {
        e.preventDefault();
        e.stopPropagation();

        if (!editor.selection.isCollapsed()) {
          editor.selection.remove();
        }

        var marker = editor.markers.insert();

        if (marker) {
          var prev_node = marker.previousSibling;
          var next_node = marker.nextSibling;

          if (!next_node && marker.parentNode && marker.parentNode.tagName === 'A') {
            marker.parentNode.insertAdjacentHTML('afterend', "&nbsp;".concat(FroalaEditor.MARKERS));
            marker.parentNode.removeChild(marker);
          } else {
            if (prev_node && prev_node.nodeType === Node.TEXT_NODE && prev_node.textContent.length === 1 && prev_node.textContent.charCodeAt(0) === 160) {
              prev_node.textContent += ' ';
            } else {
              marker.insertAdjacentHTML('beforebegin', '&nbsp;');
            }

            marker.outerHTML = FroalaEditor.MARKERS;
          }

          editor.selection.restore();
        }
      }
    }
    /**
     * Handle typing in Korean for FF.
     */


    function _input() {
      // Select is collapsed and we're not using IME.
      if (editor.browser.mozilla && editor.selection.isCollapsed() && !IME) {
        var range = editor.selection.ranges(0);
        var start_container = range.startContainer;
        var start_offset = range.startOffset; // Start container is text and last char before cursor is space.

        if (start_container && start_container.nodeType === Node.TEXT_NODE && start_offset <= start_container.textContent.length && start_offset > 0 && start_container.textContent.charCodeAt(start_offset - 1) === 32) {
          editor.selection.save();
          editor.spaces.normalize();
          editor.selection.restore();
        }
      }
    }
    /**
     * Cut.
     */


    function _cut() {
      if (editor.selection.isFull()) {
        setTimeout(function () {
          var default_tag = editor.html.defaultTag();

          if (default_tag) {
            editor.$el.html("<".concat(default_tag, ">").concat(FroalaEditor.MARKERS, "<br/></").concat(default_tag, ">"));
          } else {
            editor.$el.html("".concat(FroalaEditor.MARKERS, "<br/>"));
          }

          editor.selection.restore();
          editor.placeholder.refresh();
          editor.button.bulkRefresh();
          editor.undo.saveStep();
        }, 0);
      }
    }
    /**
     * Tab.
     */


    function _tab(e) {
      if (editor.opts.tabSpaces > 0) {
        if (editor.selection.isCollapsed()) {
          editor.undo.saveStep();
          e.preventDefault();
          e.stopPropagation();
          var str = '';

          for (var i = 0; i < editor.opts.tabSpaces; i++) {
            str += '&nbsp;';
          }

          editor.html.insert(str);
          editor.placeholder.refresh();
          editor.undo.saveStep();
        } else {
          e.preventDefault();
          e.stopPropagation();

          if (!e.shiftKey) {
            editor.commands.indent();
          } else {
            editor.commands.outdent();
          }
        }
      }
    }
    /**
     * Map keyPress actions.
     */


    function _mapKeyPress() {
      IME = false;
    }

    function _clearIME() {
      IME = false;
    }
    /**
     * If is IME.
     */


    function isIME() {
      return IME;
    }

    var key_down_code;

    function _empty() {
      var default_tag = editor.html.defaultTag();

      if (default_tag) {
        editor.$el.html("<".concat(default_tag, ">").concat(FroalaEditor.MARKERS, "<br/></").concat(default_tag, ">"));
      } else {
        editor.$el.html("".concat(FroalaEditor.MARKERS, "<br/>"));
      }

      editor.selection.restore();
    }
    /**
     * Map keyDown actions.
     */


    function _mapKeyDown(e) {
      var sel_el = editor.selection.element();

      if (sel_el && ['INPUT', 'TEXTAREA'].indexOf(sel_el.tagName) >= 0) {
        return true;
      }

      if (e && isArrow(e.which)) {
        return true;
      }

      editor.events.disableBlur();
      var key_code = e.which;

      if (key_code === 16) {
        return true;
      }

      key_down_code = key_code; // Handle Japanese typing.

      if (key_code === FroalaEditor.KEYCODE.IME) {
        IME = true;
        return true;
      }

      IME = false;
      var char_key = isCharacter(key_code) && !ctrlKey(e) && !e.altKey;
      var del_key = key_code === FroalaEditor.KEYCODE.BACKSPACE || key_code === FroalaEditor.KEYCODE.DELETE; // 1. Selection is full.
      // 2. Del key is hit, editor is empty and there is keepFormatOnDelete.

      if (editor.selection.isFull() && !editor.opts.keepFormatOnDelete && !editor.placeholder.isVisible() || del_key && editor.placeholder.isVisible() && editor.opts.keepFormatOnDelete) {
        if (char_key || del_key) {
          _empty();

          if (!isCharacter(key_code)) {
            e.preventDefault();
            return true;
          }
        }
      } // ENTER.


      if (key_code === FroalaEditor.KEYCODE.ENTER) {
        if (e.shiftKey) {
          _shiftEnter(e);
        } else {
          _enter(e);
        }
      } // Ctrl/Command Backspace.
      else if (key_code === FroalaEditor.KEYCODE.BACKSPACE && (e.metaKey || e.ctrlKey)) {
          _ctlBackspace();
        } // Backspace.
        else if (key_code === FroalaEditor.KEYCODE.BACKSPACE && !ctrlKey(e) && !e.altKey) {
            if (!editor.placeholder.isVisible()) {
              _backspace(e);
            } else {
              if (!editor.opts.keepFormatOnDelete) {
                _empty();
              }

              e.preventDefault();
              e.stopPropagation();
            }
          } // Delete.
          else if (key_code === FroalaEditor.KEYCODE.DELETE && !ctrlKey(e) && !e.altKey && !e.shiftKey) {
              if (!editor.placeholder.isVisible()) {
                _del(e);
              } else {
                if (!editor.opts.keepFormatOnDelete) {
                  _empty();
                }

                e.preventDefault();
                e.stopPropagation();
              }
            } // Space.
            else if (key_code === FroalaEditor.KEYCODE.SPACE) {
                _space(e);
              } // Tab.
              else if (key_code === FroalaEditor.KEYCODE.TAB) {
                  _tab(e);
                } // Char key.
                else if (!ctrlKey(e) && isCharacter(e.which) && !editor.selection.isCollapsed() && !e.ctrlKey && !e.altKey) {
                    editor.selection.remove();
                  }

      editor.events.enableBlur();
    }
    /**
     * Remove U200B.
     */


    function _replaceU200B(el) {
      var walker = editor.doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, editor.node.filter(function (node) {
        return /\u200B/gi.test(node.textContent);
      }), false);

      while (walker.nextNode()) {
        var node = walker.currentNode;
        node.textContent = node.textContent.replace(/\u200B/gi, '');
      }
    }

    function positionCaret() {
      if (!editor.$wp) {
        return true;
      }

      var info;

      if (!editor.opts.height && !editor.opts.heightMax) {
        // Make sure we scroll bottom.
        info = editor.position.getBoundingRect().top; // https://github.com/froala/wysiwyg-editor/issues/834.

        if (editor.opts.toolbarBottom) {
          info += editor.opts.toolbarStickyOffset;
        }

        if (editor.helpers.isIOS() || editor.helpers.isAndroid()) {
          info -= editor.helpers.scrollTop();
        }

        if (editor.opts.iframe) {
          info += editor.$iframe.offset().top; // https://github.com/froala-labs/froala-editor-js-2/issues/432 . getBoundingRect will return different results in iframe because the viewport.

          info -= editor.helpers.scrollTop();
        }

        info += editor.opts.toolbarStickyOffset;

        if (info > editor.o_win.innerHeight - 20) {
          $(editor.o_win).scrollTop(info + editor.helpers.scrollTop() - editor.o_win.innerHeight + 20);
        } // Make sure we scroll top.


        info = editor.position.getBoundingRect().top; // https://github.com/froala/wysiwyg-editor/issues/834.

        if (!editor.opts.toolbarBottom) {
          info -= editor.opts.toolbarStickyOffset;
        }

        if (editor.helpers.isIOS() || editor.helpers.isAndroid()) {
          info -= editor.helpers.scrollTop();
        }

        if (editor.opts.iframe) {
          info += editor.$iframe.offset().top; // https://github.com/froala-labs/froala-editor-js-2/issues/432 . getBoundingRect will return different results in iframe because the viewport.

          info -= editor.helpers.scrollTop();
        }

        if (info < 100) {
          $(editor.o_win).scrollTop(info + editor.helpers.scrollTop() - 100);
        }
      } else {
        // Make sure we scroll bottom.
        info = editor.position.getBoundingRect().top;

        if (editor.helpers.isIOS() || editor.helpers.isAndroid()) {
          info -= editor.helpers.scrollTop();
        }

        if (editor.opts.iframe) {
          info += editor.$iframe.offset().top;
        }

        if (info > editor.$wp.offset().top - editor.helpers.scrollTop() + editor.$wp.height() - 20) {
          editor.$wp.scrollTop(info + editor.$wp.scrollTop() - (editor.$wp.height() + editor.$wp.offset().top) + editor.helpers.scrollTop() + 20);
        }
      }
    }
    /**
     * Map keyUp actions.
     */


    function _mapKeyUp(e) {
      var sel_el = editor.selection.element();

      if (sel_el && ['INPUT', 'TEXTAREA'].indexOf(sel_el.tagName) >= 0) {
        return true;
      } // When using iOS soft keyboard, in keyup we get 0 for keycode,
      // therefore, we are using the one we got on keydown.


      if (e && e.which === 0 && key_down_code) {
        e.which = key_down_code;
      }

      if (editor.helpers.isAndroid() && editor.browser.mozilla) {
        return true;
      } // IME IE.


      if (IME) {
        return false;
      } // Revert ios default ENTER.


      if (e && editor.helpers.isIOS() && e.which === FroalaEditor.KEYCODE.ENTER) {
        editor.doc.execCommand('undo');
      }

      if (!editor.selection.isCollapsed()) {
        return true;
      }

      if (e && (e.which === FroalaEditor.KEYCODE.META || e.which === FroalaEditor.KEYCODE.CTRL)) {
        return true;
      }

      if (e && isArrow(e.which)) {
        return true;
      }

      if (e && !editor.helpers.isIOS() && (e.which === FroalaEditor.KEYCODE.ENTER || e.which === FroalaEditor.KEYCODE.BACKSPACE || e.which >= 37 && e.which <= 40 && !editor.browser.msie)) {
        try {
          positionCaret();
        } catch (ex) {// ok.
        }
      } // Remove invisible space where possible.


      function has_invisible(node) {
        if (!node) {
          return false;
        }

        var text = node.innerHTML;
        text = text.replace(/<span[^>]*? class\s*=\s*["']?fr-marker["']?[^>]+>\u200b<\/span>/gi, '');

        if (text && /\u200B/.test(text) && text.replace(/\u200B/gi, '').length > 0) {
          return true;
        }

        return false;
      }

      function ios_CJK(el) {
        var CJKRegEx = /[\u3041-\u3096\u30A0-\u30FF\u4E00-\u9FFF\u3130-\u318F\uAC00-\uD7AF]/gi;
        return !editor.helpers.isIOS() || ((el.textContent || '').match(CJKRegEx) || []).length === 0;
      } // Get the selection element.


      var el = editor.selection.element();

      if (has_invisible(el) && !editor.node.hasClass(el, 'fr-marker') && el.tagName !== 'IFRAME' && ios_CJK(el)) {
        editor.selection.save();

        _replaceU200B(el);

        editor.selection.restore();
      }
    } // Check if we should consider that CTRL key is pressed.


    function ctrlKey(e) {
      if (navigator.userAgent.indexOf('Mac OS X') !== -1) {
        if (e.metaKey && !e.altKey) {
          return true;
        }
      } else if (e.ctrlKey && !e.altKey) {
        return true;
      }

      return false;
    }

    function isArrow(key_code) {
      if (key_code >= FroalaEditor.KEYCODE.ARROW_LEFT && key_code <= FroalaEditor.KEYCODE.ARROW_DOWN) {
        return true;
      }
    }

    function isCharacter(key_code) {
      if (key_code >= FroalaEditor.KEYCODE.ZERO && key_code <= FroalaEditor.KEYCODE.NINE) {
        return true;
      }

      if (key_code >= FroalaEditor.KEYCODE.NUM_ZERO && key_code <= FroalaEditor.KEYCODE.NUM_MULTIPLY) {
        return true;
      }

      if (key_code >= FroalaEditor.KEYCODE.A && key_code <= FroalaEditor.KEYCODE.Z) {
        return true;
      } // Safari sends zero key code for non-latin characters.


      if (editor.browser.webkit && key_code === 0) {
        return true;
      }

      switch (key_code) {
        case FroalaEditor.KEYCODE.SPACE:
        case FroalaEditor.KEYCODE.QUESTION_MARK:
        case FroalaEditor.KEYCODE.NUM_PLUS:
        case FroalaEditor.KEYCODE.NUM_MINUS:
        case FroalaEditor.KEYCODE.NUM_PERIOD:
        case FroalaEditor.KEYCODE.NUM_DIVISION:
        case FroalaEditor.KEYCODE.SEMICOLON:
        case FroalaEditor.KEYCODE.FF_SEMICOLON:
        case FroalaEditor.KEYCODE.DASH:
        case FroalaEditor.KEYCODE.EQUALS:
        case FroalaEditor.KEYCODE.FF_EQUALS:
        case FroalaEditor.KEYCODE.COMMA:
        case FroalaEditor.KEYCODE.PERIOD:
        case FroalaEditor.KEYCODE.SLASH:
        case FroalaEditor.KEYCODE.APOSTROPHE:
        case FroalaEditor.KEYCODE.SINGLE_QUOTE:
        case FroalaEditor.KEYCODE.OPEN_SQUARE_BRACKET:
        case FroalaEditor.KEYCODE.BACKSLASH:
        case FroalaEditor.KEYCODE.CLOSE_SQUARE_BRACKET:
          return true;

        default:
          return false;
      }
    }

    var _typing_timeout;

    var _temp_snapshot;

    function _typingKeyDown(e) {
      var keycode = e.which;

      if (ctrlKey(e) || keycode >= 37 && keycode <= 40 || !isCharacter(keycode) && keycode !== FroalaEditor.KEYCODE.DELETE && keycode !== FroalaEditor.KEYCODE.BACKSPACE && keycode !== FroalaEditor.KEYCODE.ENTER && keycode !== FroalaEditor.KEYCODE.IME) {
        return true;
      }

      if (!_typing_timeout) {
        _temp_snapshot = editor.snapshot.get();

        if (!editor.undo.canDo()) {
          editor.undo.saveStep();
        }
      }

      clearTimeout(_typing_timeout);
      _typing_timeout = setTimeout(function () {
        _typing_timeout = null;
        editor.undo.saveStep();
      }, Math.max(250, editor.opts.typingTimer));
    }

    function _typingKeyUp(e) {
      var keycode = e.which;

      if (ctrlKey(e) || keycode >= 37 && keycode <= 40) {
        return true;
      }

      if (_temp_snapshot && _typing_timeout) {
        editor.undo.saveStep(_temp_snapshot);
        _temp_snapshot = null;
      } // iOS choosing suggestion.
      else if ((typeof keycode === 'undefined' || keycode === 0) && !_temp_snapshot && !_typing_timeout) {
          editor.undo.saveStep();
        }
    }

    function forceUndo() {
      if (_typing_timeout) {
        clearTimeout(_typing_timeout);
        editor.undo.saveStep();
        _temp_snapshot = null;
      }
    }
    /**
     * Check if key event is part of browser accessibility.
     */


    function isBrowserAction(e) {
      var keycode = e.which;
      return ctrlKey(e) || keycode === FroalaEditor.KEYCODE.F5;
    } // Node doesn't have a BR or text inside it.


    function _isEmpty(node) {
      if (node && node.tagName === 'BR') {
        return false;
      } // No text and no BR.
      // Special case for image caption / video.


      try {
        return (node.textContent || '').length === 0 && node.querySelector && !node.querySelector(':scope > br') || node.childNodes && node.childNodes.length === 1 && node.childNodes[0].getAttribute && (node.childNodes[0].getAttribute('contenteditable') === 'false' || editor.node.hasClass(node.childNodes[0], 'fr-img-caption'));
      } catch (ex) {
        return false;
      }
    }
    /**
     * Allow typing after/before last element.
     */


    function _allowTypingOnEdges(e) {
      var childs = editor.el.childNodes;
      var dt = editor.html.defaultTag();
      var deep_parent = editor.node.blockParent(editor.selection.blocks()[0]); // https://github.com/froala-labs/froala-editor-js-2/issues/1571

      if (deep_parent && deep_parent.tagName == 'TR' && deep_parent.getAttribute('contenteditable') == undefined) {
        deep_parent = deep_parent.closest('table');
      } // https://github.com/CelestialSystem/froala-editor-js-2/tree/1303
      // get the selected text block parent as deep_parent
      // Check for content editable:false node and disable toolbar


      if (!editor.node.isEditable(e.target) || deep_parent && deep_parent.getAttribute('contenteditable') === 'false') {
        editor.toolbar.disable();
      } else {
        editor.toolbar.enable();
      }

      if (e.target && e.target !== editor.el) {
        return true;
      } // No childs.


      if (childs.length === 0) {
        return true;
      } // At the bottom.
      // https://github.com/froala/wysiwyg-editor/issues/3397


      if (childs[0].offsetHeight + childs[0].offsetTop <= e.offsetY) {
        if (_isEmpty(childs[childs.length - 1])) {
          if (dt) {
            editor.$el.append("<".concat(dt, ">").concat(FroalaEditor.MARKERS, "<br></").concat(dt, ">"));
          } else {
            editor.$el.append("".concat(FroalaEditor.MARKERS, "<br>"));
          } // Restore selection and scroll.


          editor.selection.restore();
          positionCaret();
        }
      } // At the top
      else if (e.offsetY <= 10) {
          if (_isEmpty(childs[0])) {
            if (dt) {
              editor.$el.prepend("<".concat(dt, ">").concat(FroalaEditor.MARKERS, "<br></").concat(dt, ">"));
            } else {
              editor.$el.prepend("".concat(FroalaEditor.MARKERS, "<br>"));
            } // Restore selection and scroll.


            editor.selection.restore();
            positionCaret();
          }
        }
    }

    function _clearTypingTimer() {
      if (_typing_timeout) {
        clearTimeout(_typing_timeout);
      }
    }
    /**
     * Tear up.
     */


    function _init() {
      editor.events.on('keydown', _typingKeyDown);
      editor.events.on('input', _input);
      editor.events.on('mousedown', _clearIME);
      editor.events.on('keyup input', _typingKeyUp); // Register for handling.

      editor.events.on('keypress', _mapKeyPress);
      editor.events.on('keydown', _mapKeyDown);
      editor.events.on('keyup', _mapKeyUp);
      editor.events.on('destroy', _clearTypingTimer);
      editor.events.on('html.inserted', _mapKeyUp); // Handle cut.

      editor.events.on('cut', _cut); // Click in editor at beginning / end.

      if (editor.opts.multiLine) {
        editor.events.on('click', _allowTypingOnEdges);
      }
    }

    return {
      _init: _init,
      ctrlKey: ctrlKey,
      isCharacter: isCharacter,
      isArrow: isArrow,
      forceUndo: forceUndo,
      isIME: isIME,
      isBrowserAction: isBrowserAction,
      positionCaret: positionCaret
    };
  };

  Object.assign(FroalaEditor.DEFAULTS, {
    pastePlain: false,
    pasteDeniedTags: ['colgroup', 'col', 'meta'],
    pasteDeniedAttrs: ['class', 'id'],
    pasteAllowedStyleProps: ['.*'],
    pasteAllowLocalImages: false
  });

  FroalaEditor.MODULES.paste = function (editor) {
    var $ = editor.$;
    var clipboard_html;
    var clipboard_rtf;
    var $paste_div;
    var snapshot;

    function saveCopiedText(html, plain) {
      try {
        editor.win.localStorage.setItem('fr-copied-html', html);
        editor.win.localStorage.setItem('fr-copied-text', plain);
      } catch (ex) {// do no matter what
      }
    }
    /**
     * Handle copy and cut.
     */


    function _handleCopy(e) {
      var copied_html = editor.html.getSelected();
      saveCopiedText(copied_html, $(editor.doc.createElement('div')).html(copied_html).text());

      if (e.type === 'cut') {
        editor.undo.saveStep();
        setTimeout(function () {
          editor.selection.save();
          editor.html.wrap();
          editor.selection.restore();
          editor.events.focus();
          editor.undo.saveStep();
        }, 0);
      }
    }
    /**
     * Handle pasting.
     */


    var stop_paste = false;

    function _handlePaste(e) {
      if (editor.edit.isDisabled()) {
        return false;
      }

      if (stop_paste) {
        return false;
      }

      if (e.originalEvent) {
        e = e.originalEvent;
      }

      if (editor.events.trigger('paste.before', [e]) === false) {
        e.preventDefault();
        return false;
      } // Read data from clipboard.


      if (e && e.clipboardData && e.clipboardData.getData) {
        var types = '';
        var clipboard_types = e.clipboardData.types;

        if (editor.helpers.isArray(clipboard_types)) {
          for (var i = 0; i < clipboard_types.length; i++) {
            types += "".concat(clipboard_types[i], ";");
          }
        } else {
          types = clipboard_types;
        }

        clipboard_html = ''; // Get rtf clipboard.

        if (/text\/rtf/.test(types)) {
          clipboard_rtf = e.clipboardData.getData('text/rtf');
        } // HTML.


        if (/text\/html/.test(types) && !editor.browser.safari) {
          clipboard_html = e.clipboardData.getData('text/html');
        } // Safari HTML.
        else if (/text\/rtf/.test(types) && editor.browser.safari) {
            clipboard_html = clipboard_rtf;
          } // Safari HTML for iOS.
          else if (/public.rtf/.test(types) && editor.browser.safari) {
              clipboard_html = e.clipboardData.getData('text/rtf');
            }

        if (clipboard_html !== '') {
          _processPaste();

          if (e.preventDefault) {
            e.stopPropagation();
            e.preventDefault();
          }

          return false;
        }

        clipboard_html = null;
      } // Normal paste.


      _beforePaste();

      return false;
    }
    /**
     * Handle dropping content in the editor.
     */


    function _dropPaste(e) {
      if (e.originalEvent) {
        e = e.originalEvent;
      } // Read data from clipboard.


      if (e && e.dataTransfer && e.dataTransfer.getData) {
        var types = '';
        var clipboard_types = e.dataTransfer.types;

        if (editor.helpers.isArray(clipboard_types)) {
          for (var i = 0; i < clipboard_types.length; i++) {
            types += "".concat(clipboard_types[i], ";");
          }
        } else {
          types = clipboard_types;
        }

        clipboard_html = ''; // Get rtf clipboard.

        if (/text\/rtf/.test(types)) {
          clipboard_rtf = e.dataTransfer.getData('text/rtf');
        } // HTML.


        if (/text\/html/.test(types)) {
          clipboard_html = e.dataTransfer.getData('text/html');
        } // Safari HTML.
        else if (/text\/rtf/.test(types) && editor.browser.safari) {
            clipboard_html = clipboard_rtf;
          } else if (/text\/plain/.test(types) && !this.browser.mozilla) {
            clipboard_html = editor.html.escapeEntities(e.dataTransfer.getData('text/plain')).replace(/\n/g, '<br>');
          }

        if (clipboard_html !== '') {
          editor.keys.forceUndo();
          snapshot = editor.snapshot.get(); // Save selection, but change markers class so that we can restore it later.

          editor.selection.save();
          editor.$el.find('.fr-marker').removeClass('fr-marker').addClass('fr-marker-helper'); // Insert marker point helper and change class to restore it later.

          var ok = editor.markers.insertAtPoint(e);
          editor.$el.find('.fr-marker').removeClass('fr-marker').addClass('fr-marker-placeholder'); // Restore selection and remove it.

          editor.$el.find('.fr-marker-helper').addClass('fr-marker').removeClass('fr-marker-helper');
          editor.selection.restore();
          editor.selection.remove(); // Restore marker point helper.

          editor.$el.find('.fr-marker-placeholder').addClass('fr-marker').removeClass('fr-marker-placeholder');

          if (ok !== false) {
            // Insert markers.
            var marker = editor.el.querySelector('.fr-marker');
            $(marker).replaceWith(FroalaEditor.MARKERS);
            editor.selection.restore();

            _processPaste();

            if (e.preventDefault) {
              e.stopPropagation();
              e.preventDefault();
            }

            return false;
          }
        } else {
          clipboard_html = null;
        }
      }
    }
    /**
     * Before starting to paste.
     */


    function _beforePaste() {
      // Save selection
      editor.selection.save();
      editor.events.disableBlur(); // Set clipboard HTML.

      clipboard_html = null; // Remove and store the editable content

      if (!$paste_div) {
        $paste_div = $('<div contenteditable="true" style="position: fixed; top: 0; left: -9999px; height: 100%; width: 0; word-break: break-all; overflow:hidden; z-index: 2147483647; line-height: 140%; -moz-user-select: text; -webkit-user-select: text; -ms-user-select: text; user-select: text;" tabIndex="-1"></div>'); // Sketch app fix. https://github.com/froala/wysiwyg-editor/issues/2042
        // Also: when using iframe Safari needs to have focus in the same window.

        if (editor.browser.webkit || editor.browser.mozilla) {
          $paste_div.css('top', editor.$sc.scrollTop());
          editor.$el.after($paste_div);
        } else if (editor.browser.edge && editor.opts.iframe) {
          editor.$el.append($paste_div);
        } else {
          editor.$box.after($paste_div);
        }

        editor.events.on('destroy', function () {
          $paste_div.remove();
        });
      } else {
        $paste_div.html('');

        if (editor.browser.edge && editor.opts.iframe) {
          editor.$el.append($paste_div);
        }
      }

      var st; // Prevent iOS scroll.

      if (editor.helpers.isIOS() && editor.$sc) {
        st = editor.$sc.scrollTop();
      } // Focus on the pasted div.


      if (editor.opts.iframe) {
        editor.$el.attr('contenteditable', 'false');
      }

      $paste_div.focus(); // Prevent iOS scroll.

      if (editor.helpers.isIOS() && editor.$sc) {
        editor.$sc.scrollTop(st);
      } // Process paste soon.


      editor.win.setTimeout(_processPaste, 1);
    }
    /**
     * Clean HTML that was pasted from Word.
     */


    function _wordClean(html) {
      var i; // Single item list.

      html = html.replace(/<p(.*?)class="?'?MsoListParagraph"?'? ([\s\S]*?)>([\s\S]*?)<\/p>/gi, '<ul><li>$3</li></ul>');
      html = html.replace(/<p(.*?)class="?'?NumberedText"?'? ([\s\S]*?)>([\s\S]*?)<\/p>/gi, '<ol><li>$3</li></ol>'); // List start.

      html = html.replace(/<p(.*?)class="?'?MsoListParagraphCxSpFirst"?'?([\s\S]*?)(level\d)?([\s\S]*?)>([\s\S]*?)<\/p>/gi, '<ul><li$3>$5</li>');
      html = html.replace(/<p(.*?)class="?'?NumberedTextCxSpFirst"?'?([\s\S]*?)(level\d)?([\s\S]*?)>([\s\S]*?)<\/p>/gi, '<ol><li$3>$5</li>'); // List middle.

      html = html.replace(/<p(.*?)class="?'?MsoListParagraphCxSpMiddle"?'?([\s\S]*?)(level\d)?([\s\S]*?)>([\s\S]*?)<\/p>/gi, '<li$3>$5</li>');
      html = html.replace(/<p(.*?)class="?'?NumberedTextCxSpMiddle"?'?([\s\S]*?)(level\d)?([\s\S]*?)>([\s\S]*?)<\/p>/gi, '<li$3>$5</li>');
      html = html.replace(/<p(.*?)class="?'?MsoListBullet"?'?([\s\S]*?)(level\d)?([\s\S]*?)>([\s\S]*?)<\/p>/gi, '<li$3>$5</li>'); // List end.

      html = html.replace(/<p(.*?)class="?'?MsoListParagraphCxSpLast"?'?([\s\S]*?)(level\d)?([\s\S]*?)>([\s\S]*?)<\/p>/gi, '<li$3>$5</li></ul>');
      html = html.replace(/<p(.*?)class="?'?NumberedTextCxSpLast"?'?([\s\S]*?)(level\d)?([\s\S]*?)>([\s\S]*?)<\/p>/gi, '<li$3>$5</li></ol>'); // Clean list bullets.

      html = html.replace(/<span([^<]*?)style="?'?mso-list:Ignore"?'?([\s\S]*?)>([\s\S]*?)<span/gi, '<span><span'); // Webkit clean list bullets.

      html = html.replace(/<!--\[if !supportLists\]-->([\s\S]*?)<!--\[endif\]-->/gi, '');
      html = html.replace(/<!\[if !supportLists\]>([\s\S]*?)<!\[endif\]>/gi, ''); // Remove mso classes.

      html = html.replace(/(\n|\r| class=(")?Mso[a-zA-Z0-9]+(")?)/gi, ' '); // Remove comments.

      html = html.replace(/<!--[\s\S]*?-->/gi, ''); // Remove tags but keep content.

      html = html.replace(/<(\/)*(meta|link|span|\\?xml:|st1:|o:|font)(.*?)>/gi, ''); // Remove no needed tags.

      var word_tags = ['style', 'script', 'applet', 'embed', 'noframes', 'noscript'];

      for (i = 0; i < word_tags.length; i++) {
        var regex = new RegExp("<".concat(word_tags[i], ".*?").concat(word_tags[i], "(.*?)>"), 'gi');
        html = html.replace(regex, '');
      } // Remove spaces.


      html = html.replace(/&nbsp;/gi, ' '); // Keep empty TH and TD.

      html = html.replace(/<td([^>]*)><\/td>/g, '<td$1><br></td>');
      html = html.replace(/<th([^>]*)><\/th>/g, '<th$1><br></th>'); // Remove empty tags.

      var oldHTML;

      do {
        oldHTML = html;
        html = html.replace(/<[^/>][^>]*><\/[^>]+>/gi, '');
      } while (html !== oldHTML); // Process list indentation.


      html = html.replace(/<lilevel([^1])([^>]*)>/gi, '<li data-indent="true"$2>');
      html = html.replace(/<lilevel1([^>]*)>/gi, '<li$1>'); // Clean HTML.

      html = editor.clean.html(html, editor.opts.pasteDeniedTags, editor.opts.pasteDeniedAttrs); // Clean empty links.

      html = html.replace(/<a>(.[^<]+)<\/a>/gi, '$1'); // https://github.com/froala/wysiwyg-editor/issues/1364.

      html = html.replace(/<br> */g, '<br>'); // Process list indent.

      var div = editor.o_doc.createElement('div');
      div.innerHTML = html;
      var lis = div.querySelectorAll('li[data-indent]');

      for (i = 0; i < lis.length; i++) {
        var li = lis[i];
        var p_li = li.previousElementSibling;

        if (p_li && p_li.tagName === 'LI') {
          var list = p_li.querySelector(':scope > ul, :scope > ol');

          if (!list) {
            list = document.createElement('ul');
            p_li.appendChild(list);
          }

          list.appendChild(li);
        } else {
          li.removeAttribute('data-indent');
        }
      }

      editor.html.cleanBlankSpaces(div);
      html = div.innerHTML;
      return html;
    }
    /**
     * Plain clean.
     */


    function _plainPasteClean(html) {
      var el = null;
      var i;
      var div = editor.doc.createElement('div');
      div.innerHTML = html;
      var els = div.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, pre, blockquote');

      for (i = 0; i < els.length; i++) {
        el = els[i];
        el.outerHTML = "<".concat(editor.html.defaultTag() || 'DIV', ">").concat(el.innerHTML, "</").concat(editor.html.defaultTag() || 'DIV', ">");
      }

      els = div.querySelectorAll("*:not(".concat('p, div, h1, h2, h3, h4, h5, h6, pre, blockquote, ul, ol, li, table, tbody, thead, tr, td, br, img'.split(',').join('):not('), ")"));

      for (i = els.length - 1; i >= 0; i--) {
        el = els[i];
        el.outerHTML = el.innerHTML;
      } // Remove comments.


      function cleanComments(node) {
        var contents = editor.node.contents(node);

        for (var _i = 0; _i < contents.length; _i++) {
          if (contents[_i].nodeType !== Node.TEXT_NODE && contents[_i].nodeType !== Node.ELEMENT_NODE) {
            contents[_i].parentNode.removeChild(contents[_i]);
          } else {
            cleanComments(contents[_i]);
          }
        }
      }

      cleanComments(div);
      return div.innerHTML;
    }
    /**
     * Process the pasted HTML.
     */


    function _processPaste() {
      if (editor.opts.iframe) {
        editor.$el.attr('contenteditable', 'true');
      }

      if (editor.browser.edge && editor.opts.iframe) {
        editor.$box.after($paste_div);
      } // Save undo snapshot.


      if (!snapshot) {
        editor.keys.forceUndo();
        snapshot = editor.snapshot.get();
      } // Cannot read from clipboard.


      if (!clipboard_html) {
        clipboard_html = $paste_div.get(0).innerHTML;
        editor.selection.restore();
        editor.events.enableBlur();
      }

      var is_word = clipboard_html.match(/(class="?Mso|class='?Mso|class="?Xl|class='?Xl|class=Xl|style="[^"]*\bmso-|style='[^']*\bmso-|w:WordDocument|LibreOffice)/gi); // Trigger chain cleanp.

      var response = editor.events.chainTrigger('paste.beforeCleanup', clipboard_html);

      if (response && typeof response === 'string') {
        clipboard_html = response;
      } // Clean non-word or word if no plugin processed the paste.


      if (!is_word || is_word && editor.events.trigger('paste.wordPaste', [clipboard_html]) !== false) {
        clean(clipboard_html, is_word);
      }
    }
    /**
     * Check if pasted content comes from the editor.
     */


    function _isFromEditor(clipboard_html) {
      var possible_text = null;

      try {
        possible_text = editor.win.localStorage.getItem('fr-copied-text');
      } catch (ex) {// continue no matter what.a
      }

      if (possible_text && $('<div>').html(clipboard_html).text().replace(/\u00A0/gi, ' ').replace(/\r|\n/gi, '') === possible_text.replace(/\u00A0/gi, ' ').replace(/\r|\n/gi, '')) {
        return true;
      }

      return false;
    }

    function _buildTabs(len) {
      var tabs = '';
      var i = 0;

      while (i++ < len) {
        tabs += '&nbsp;';
      }

      return tabs;
    }
    /**
     * Clean clipboard html.
     */


    function clean(clipboard_html, is_word, keep_formatting) {
      var els = null;
      var el = null;
      var i; // Keep only body if there is.

      if (clipboard_html.toLowerCase().indexOf('<body') >= 0) {
        var style = '';

        if (clipboard_html.indexOf('<style') >= 0) {
          style = clipboard_html.replace(/[.\s\S\w\W<>]*(<style[^>]*>[\s]*[.\s\S\w\W<>]*[\s]*<\/style>)[.\s\S\w\W<>]*/gi, '$1');
        }

        clipboard_html = style + clipboard_html.replace(/[.\s\S\w\W<>]*<body[^>]*>[\s]*([.\s\S\w\W<>]*)[\s]*<\/body>[.\s\S\w\W<>]*/gi, '$1');
        clipboard_html = clipboard_html.replace(/ \n/g, ' ').replace(/\n /g, ' ').replace(/([^>])\n([^<])/g, '$1 $2');
      } // Google Docs paste.


      var is_gdocs = false;

      if (clipboard_html.indexOf('id="docs-internal-guid') >= 0) {
        clipboard_html = clipboard_html.replace(/^[\w\W\s\S]* id="docs-internal-guid[^>]*>([\w\W\s\S]*)<\/b>[\w\W\s\S]*$/g, '$1');
        is_gdocs = true;
      }

      if (clipboard_html.indexOf('content="Sheets"') >= 0) {
        clipboard_html = clipboard_html.replace(/width:0px;/g, '');
      } // Not word paste.


      var is_editor_content = false;

      if (!is_word) {
        is_editor_content = _isFromEditor(clipboard_html); // Remove pasting token.

        if (is_editor_content) {
          clipboard_html = editor.win.localStorage.getItem('fr-copied-html');
        }

        if (!is_editor_content) {
          // Remove comments.
          var htmlAllowedStylePropsCopy = editor.opts.htmlAllowedStyleProps;
          editor.opts.htmlAllowedStyleProps = editor.opts.pasteAllowedStyleProps;
          editor.opts.htmlAllowComments = false; // Pasting from Apple Notes.

          clipboard_html = clipboard_html.replace(/<span class="Apple-tab-span">\s*<\/span>/g, _buildTabs(editor.opts.tabSpaces || 4));
          clipboard_html = clipboard_html.replace(/<span class="Apple-tab-span" style="white-space:pre">(\t*)<\/span>/g, function (str, x) {
            return _buildTabs(x.length * (editor.opts.tabSpaces || 4));
          }); // Pasting from other sources with tabs.

          clipboard_html = clipboard_html.replace(/\t/g, _buildTabs(editor.opts.tabSpaces || 4));
          clipboard_html = editor.clean.html(clipboard_html, editor.opts.pasteDeniedTags, editor.opts.pasteDeniedAttrs);
          editor.opts.htmlAllowedStyleProps = htmlAllowedStylePropsCopy;
          editor.opts.htmlAllowComments = true; // Remove empty tags.

          clipboard_html = cleanEmptyTagsAndDivs(clipboard_html); // Do not keep entities that are not HTML compatible.

          clipboard_html = clipboard_html.replace(/\r/g, ''); // Trail ending and starting spaces.

          clipboard_html = clipboard_html.replace(/^ */g, '').replace(/ *$/g, '');
        } else {
          clipboard_html = editor.clean.html(clipboard_html, editor.opts.pasteDeniedTags, editor.opts.pasteDeniedAttrs);
        }
      } // Word paste cleanup when word plugin is not used.


      if (is_word && (!editor.wordPaste || !keep_formatting)) {
        // Strip spaces at the beginning.
        clipboard_html = clipboard_html.replace(/^\n*/g, '').replace(/^ /g, ''); // Firefox paste.

        if (clipboard_html.indexOf('<colgroup>') === 0) {
          clipboard_html = "<table>".concat(clipboard_html, "</table>");
        }

        clipboard_html = _wordClean(clipboard_html);
        clipboard_html = cleanEmptyTagsAndDivs(clipboard_html);
      } // Do plain paste cleanup.


      if (editor.opts.pastePlain && !is_editor_content) {
        clipboard_html = _plainPasteClean(clipboard_html);
      } // After paste cleanup event.


      var response = editor.events.chainTrigger('paste.afterCleanup', clipboard_html);

      if (typeof response === 'string') {
        clipboard_html = response;
      } // Check if there is anything to clean.


      if (clipboard_html !== '') {
        // Normalize spaces.
        var tmp = editor.o_doc.createElement('div');
        tmp.innerHTML = clipboard_html; // https://github.com/froala/wysiwyg-editor/issues/2632.

        if (clipboard_html.indexOf('<body>') >= 0) {
          editor.html.cleanBlankSpaces(tmp);
          editor.spaces.normalize(tmp, true);
        } else {
          editor.spaces.normalize(tmp);
        } // Remove all spans.


        var spans = tmp.getElementsByTagName('span');

        for (i = spans.length - 1; i >= 0; i--) {
          var span = spans[i];

          if (span.attributes.length === 0) {
            span.outerHTML = span.innerHTML;
          }
        } // Check for a tags linkAlwaysBlank.


        if (editor.opts.linkAlwaysBlank === true) {
          var aTags = tmp.getElementsByTagName('a');

          for (i = aTags.length - 1; i >= 0; i--) {
            var aTag = aTags[i];

            if (!aTag.getAttribute('target')) {
              aTag.setAttribute('target', '_blank');
            }
          }
        } // Check if we're inside a list.


        var selection_el = editor.selection.element();
        var in_list = false;

        if (selection_el && $(selection_el).parentsUntil(editor.el, 'ul, ol').length) {
          in_list = true;
        } // Unwrap lists if they are the only thing in the pasted HTML.


        if (in_list) {
          var list = tmp.children;

          if (list.length === 1 && ['OL', 'UL'].indexOf(list[0].tagName) >= 0) {
            list[0].outerHTML = list[0].innerHTML;
          }
        } // Remove unecessary new_lines.


        if (!is_gdocs) {
          var brs = tmp.getElementsByTagName('br');

          for (i = brs.length - 1; i >= 0; i--) {
            var br = brs[i];

            if (editor.node.isBlock(br.previousSibling)) {
              br.parentNode.removeChild(br);
            }
          }
        } // https://github.com/froala/wysiwyg-editor/issues/1493


        if (editor.opts.enter === FroalaEditor.ENTER_BR) {
          els = tmp.querySelectorAll('p, div');

          for (i = els.length - 1; i >= 0; i--) {
            el = els[i]; // Fixes https://github.com/froala/wysiwyg-editor/issues/1895.

            if (el.attributes.length === 0) {
              el.outerHTML = el.innerHTML + (el.nextSibling && !editor.node.isEmpty(el) ? '<br>' : '');
            }
          }
        } else if (editor.opts.enter === FroalaEditor.ENTER_DIV) {
          els = tmp.getElementsByTagName('p');

          for (i = els.length - 1; i >= 0; i--) {
            el = els[i];

            if (el.attributes.length === 0) {
              el.outerHTML = "<div>".concat(el.innerHTML, "</div>");
            }
          }
        } else if (editor.opts.enter === FroalaEditor.ENTER_P) {
          if (tmp.childNodes.length === 1 && tmp.childNodes[0].tagName === 'P' && tmp.childNodes[0].attributes.length === 0) {
            tmp.childNodes[0].outerHTML = tmp.childNodes[0].innerHTML;
          }
        }

        clipboard_html = tmp.innerHTML;

        if (is_editor_content) {
          clipboard_html = removeEmptyTags(clipboard_html);
        } // Insert HTML.


        editor.html.insert(clipboard_html, true);
      }

      _afterPaste();

      editor.undo.saveStep(snapshot);
      snapshot = null;
      editor.undo.saveStep();
    }
    /**
     * After pasting.
     */


    function _afterPaste() {
      editor.events.trigger('paste.after');
    }
    /*
     * Get clipboard in RTF format.
     */


    function getRtfClipboard() {
      return clipboard_rtf;
    }
    /*
     * Remove those nodes with attrs.
     */


    function _filterNoAttrs(arry) {
      for (var t = arry.length - 1; t >= 0; t--) {
        if (arry[t].attributes && arry[t].attributes.length) {
          arry.splice(t, 1);
        }
      }

      return arry;
    }

    function cleanEmptyTagsAndDivs(html) {
      var i;
      var div = editor.o_doc.createElement('div');
      div.innerHTML = html; // Workaround for Nodepad paste.

      var divs = _filterNoAttrs(Array.prototype.slice.call(div.querySelectorAll(':scope > div:not([style]), td > div:not([style]), th > div:not([style]), li > div:not([style])')));

      while (divs.length) {
        var dv = divs[divs.length - 1];

        if (editor.html.defaultTag() && editor.html.defaultTag() !== 'div') {
          // If we have nested block tags unwrap them.
          if (dv.querySelector(editor.html.blockTagsQuery())) {
            dv.outerHTML = dv.innerHTML;
          } else {
            dv.outerHTML = "<".concat(editor.html.defaultTag(), ">").concat(dv.innerHTML, "</").concat(editor.html.defaultTag(), ">");
          }
        } else {
          var els = dv.querySelectorAll('*'); // Node has some other content than BR.

          if (!els.length || els[els.length - 1].tagName !== 'BR' && dv.innerText.length === 0) {
            dv.outerHTML = dv.innerHTML + (dv.nextSibling ? '<br>' : '');
          } // Last node is not BR.
          else if (!(els.length && els[els.length - 1].tagName === 'BR' && !els[els.length - 1].nextSibling)) {
              dv.outerHTML = dv.innerHTML + (dv.nextSibling ? '<br>' : '');
            } else {
              dv.outerHTML = dv.innerHTML;
            }
        }

        divs = _filterNoAttrs(Array.prototype.slice.call(div.querySelectorAll(':scope > div:not([style]), td > div:not([style]), th > div:not([style]), li > div:not([style])')));
      } // Remove divs.


      divs = _filterNoAttrs(Array.prototype.slice.call(div.querySelectorAll('div:not([style])')));

      while (divs.length) {
        for (i = 0; i < divs.length; i++) {
          var el = divs[i];
          var text = el.innerHTML.replace(/\u0009/gi, '').trim();
          el.outerHTML = text;
        }

        divs = _filterNoAttrs(Array.prototype.slice.call(div.querySelectorAll('div:not([style])')));
      }

      return div.innerHTML;
    }
    /**
     * Remove possible empty tags in pasted HTML.
     */


    function removeEmptyTags(html) {
      var i;
      var div = editor.o_doc.createElement('div');
      div.innerHTML = html; // Clean empty tags.

      var empty_tags = div.querySelectorAll("*:empty:not(td):not(th):not(tr):not(iframe):not(svg):not(".concat(FroalaEditor.VOID_ELEMENTS.join('):not('), "):not(").concat(editor.opts.htmlAllowedEmptyTags.join('):not('), ")"));

      while (empty_tags.length) {
        for (i = 0; i < empty_tags.length; i++) {
          empty_tags[i].parentNode.removeChild(empty_tags[i]);
        }

        empty_tags = div.querySelectorAll("*:empty:not(td):not(th):not(tr):not(iframe):not(svg):not(".concat(FroalaEditor.VOID_ELEMENTS.join('):not('), "):not(").concat(editor.opts.htmlAllowedEmptyTags.join('):not('), ")"));
      }

      return div.innerHTML;
    }
    /**
     * Initialize.
     */


    function _init() {
      editor.el.addEventListener('copy', _handleCopy);
      editor.el.addEventListener('cut', _handleCopy);
      editor.el.addEventListener('paste', _handlePaste, {
        capture: true
      });
      editor.events.on('drop', _dropPaste);

      if (editor.browser.msie && editor.browser.version < 11) {
        editor.events.on('mouseup', function (e) {
          if (e.button === 2) {
            setTimeout(function () {
              stop_paste = false;
            }, 50);
            stop_paste = true;
          }
        }, true);
        editor.events.on('beforepaste', _handlePaste);
      }

      editor.events.on('destroy', _destroy);
    }

    function _destroy() {
      editor.el.removeEventListener('copy', _handleCopy);
      editor.el.removeEventListener('cut', _handleCopy);
      editor.el.removeEventListener('paste', _handlePaste);
    }

    return {
      _init: _init,
      cleanEmptyTagsAndDivs: cleanEmptyTagsAndDivs,
      getRtfClipboard: getRtfClipboard,
      saveCopiedText: saveCopiedText,
      clean: clean
    };
  };

  Object.assign(FroalaEditor.DEFAULTS, {
    shortcutsEnabled: [],
    shortcutsHint: true
  });
  FroalaEditor.SHORTCUTS_MAP = {};

  FroalaEditor.RegisterShortcut = function (key, cmd, val, letter, shift, option) {
    FroalaEditor.SHORTCUTS_MAP[(shift ? '^' : '') + (option ? '@' : '') + key] = {
      cmd: cmd,
      val: val,
      letter: letter,
      shift: shift,
      option: option
    };
    FroalaEditor.DEFAULTS.shortcutsEnabled.push(cmd);
  };

  FroalaEditor.RegisterShortcut(FroalaEditor.KEYCODE.E, 'show', null, 'E', false, false);
  FroalaEditor.RegisterShortcut(FroalaEditor.KEYCODE.B, 'bold', null, 'B', false, false);
  FroalaEditor.RegisterShortcut(FroalaEditor.KEYCODE.I, 'italic', null, 'I', false, false);
  FroalaEditor.RegisterShortcut(FroalaEditor.KEYCODE.U, 'underline', null, 'U', false, false);
  FroalaEditor.RegisterShortcut(FroalaEditor.KEYCODE.S, 'strikeThrough', null, 'S', false, false);
  FroalaEditor.RegisterShortcut(FroalaEditor.KEYCODE.CLOSE_SQUARE_BRACKET, 'indent', null, ']', false, false);
  FroalaEditor.RegisterShortcut(FroalaEditor.KEYCODE.OPEN_SQUARE_BRACKET, 'outdent', null, '[', false, false);
  FroalaEditor.RegisterShortcut(FroalaEditor.KEYCODE.Z, 'undo', null, 'Z', false, false);
  FroalaEditor.RegisterShortcut(FroalaEditor.KEYCODE.Z, 'redo', null, 'Z', true, false);
  FroalaEditor.RegisterShortcut(FroalaEditor.KEYCODE.Y, 'redo', null, 'Y', false, false);

  FroalaEditor.MODULES.shortcuts = function (editor) {
    var inverse_map = null;

    function get(cmd) {
      if (!editor.opts.shortcutsHint) {
        return null;
      }

      if (!inverse_map) {
        inverse_map = {};

        for (var key in FroalaEditor.SHORTCUTS_MAP) {
          if (Object.prototype.hasOwnProperty.call(FroalaEditor.SHORTCUTS_MAP, key) && editor.opts.shortcutsEnabled.indexOf(FroalaEditor.SHORTCUTS_MAP[key].cmd) >= 0) {
            inverse_map["".concat(FroalaEditor.SHORTCUTS_MAP[key].cmd, ".").concat(FroalaEditor.SHORTCUTS_MAP[key].val || '')] = {
              shift: FroalaEditor.SHORTCUTS_MAP[key].shift,
              option: FroalaEditor.SHORTCUTS_MAP[key].option,
              letter: FroalaEditor.SHORTCUTS_MAP[key].letter
            };
          }
        }
      }

      var srct = inverse_map[cmd];

      if (!srct) {
        return null;
      }

      return (editor.helpers.isMac() ? String.fromCharCode(8984) : "".concat(editor.language.translate('Ctrl'), "+")) + (srct.shift ? editor.helpers.isMac() ? String.fromCharCode(8679) : "".concat(editor.language.translate('Shift'), "+") : '') + (srct.option ? editor.helpers.isMac() ? String.fromCharCode(8997) : "".concat(editor.language.translate('Alt'), "+") : '') + srct.letter;
    }

    var active = false;
    /**
     * Execute shortcut.
     */

    function exec(e) {
      if (!editor.core.hasFocus()) {
        return true;
      }

      var keycode = e.which;
      var ctrlKey = navigator.userAgent.indexOf('Mac OS X') !== -1 ? e.metaKey : e.ctrlKey;

      if (e.type === 'keyup' && active) {
        if (keycode !== FroalaEditor.KEYCODE.META) {
          active = false;
          return false;
        }
      }

      if (e.type === 'keydown') {
        active = false;
      } // Build shortcuts map.


      var map_key = (e.shiftKey ? '^' : '') + (e.altKey ? '@' : '') + keycode;
      var deep_parent = editor.node.blockParent(editor.selection.blocks()[0]); // https://github.com/froala-labs/froala-editor-js-2/issues/1571

      if (deep_parent && deep_parent.tagName == 'TR' && deep_parent.getAttribute('contenteditable') == undefined) {
        deep_parent = deep_parent.closest('table');
      } // https://github.com/CelestialSystem/froala-editor-js-2/tree/1303
      // Check for content editable:false node and do not allow short-cuts


      if (ctrlKey && FroalaEditor.SHORTCUTS_MAP[map_key] && !(deep_parent && deep_parent.getAttribute('contenteditable') === 'false')) {
        var cmd = FroalaEditor.SHORTCUTS_MAP[map_key].cmd; // Check if shortcut is enabled.

        if (cmd && editor.opts.shortcutsEnabled.indexOf(cmd) >= 0) {
          var val = FroalaEditor.SHORTCUTS_MAP[map_key].val;

          if (editor.events.trigger('shortcut', [e, cmd, val]) !== false) {
            // Search for command.
            if (cmd && (editor.commands[cmd] || FroalaEditor.COMMANDS[cmd] && FroalaEditor.COMMANDS[cmd].callback)) {
              e.preventDefault();
              e.stopPropagation();

              if (e.type === 'keydown') {
                (editor.commands[cmd] || FroalaEditor.COMMANDS[cmd].callback)();
                active = true;
              }

              return false;
            }
          } else {
            active = true;
            return false;
          }
        }
      }
    }
    /**
     * Initialize.
     */


    function _init() {
      editor.events.on('keydown', exec, true);
      editor.events.on('keyup', exec, true);
    }

    return {
      _init: _init,
      get: get
    };
  };

  FroalaEditor.MODULES.snapshot = function (editor) {
    /**
     * Get the index of a node inside it's parent.
     */
    function _getNodeIndex(node) {
      var childNodes = node.parentNode.childNodes;
      var idx = 0;
      var prevNode = null;

      for (var i = 0; i < childNodes.length; i++) {
        if (prevNode) {
          // Current node is text and it is empty.
          var isEmptyText = childNodes[i].nodeType === Node.TEXT_NODE && childNodes[i].textContent === ''; // Previous node is text, current node is text.

          var twoTexts = prevNode.nodeType === Node.TEXT_NODE && childNodes[i].nodeType === Node.TEXT_NODE; // Empty prev node.

          var emptyPrevNode = prevNode.nodeType === Node.TEXT_NODE && prevNode.textContent === '';

          if (!isEmptyText && !twoTexts && !emptyPrevNode) {
            idx++;
          }
        }

        if (childNodes[i] === node) {
          return idx;
        }

        prevNode = childNodes[i];
      }
    }
    /**
     * Determine the location of the node inside the element.
     */


    function _getNodeLocation(node) {
      var loc = [];

      if (!node.parentNode) {
        return [];
      }

      while (!editor.node.isElement(node)) {
        loc.push(_getNodeIndex(node));
        node = node.parentNode;
      }

      return loc.reverse();
    }
    /**
     * Get the range offset inside the node.
     */


    function _getRealNodeOffset(node, offset) {
      while (node && node.nodeType === Node.TEXT_NODE) {
        var prevNode = node.previousSibling;

        if (prevNode && prevNode.nodeType === Node.TEXT_NODE) {
          offset += prevNode.textContent.length;
        }

        node = prevNode;
      }

      return offset;
    }
    /**
     * Codify each range.
     */


    function _getRange(range) {
      return {
        scLoc: _getNodeLocation(range.startContainer),
        scOffset: _getRealNodeOffset(range.startContainer, range.startOffset),
        ecLoc: _getNodeLocation(range.endContainer),
        ecOffset: _getRealNodeOffset(range.endContainer, range.endOffset)
      };
    }
    /**
     * Get the current snapshot.
     */


    function get() {
      var snapshot = {};
      editor.events.trigger('snapshot.before');
      snapshot.html = (editor.$wp ? editor.$el.html() : editor.$oel.get(0).outerHTML).replace(/ style=""/g, '');
      snapshot.ranges = [];

      if (editor.$wp && editor.selection.inEditor() && editor.core.hasFocus()) {
        var ranges = editor.selection.ranges();

        for (var i = 0; i < ranges.length; i++) {
          snapshot.ranges.push(_getRange(ranges[i]));
        }
      }

      editor.events.trigger('snapshot.after', [snapshot]);
      return snapshot;
    }
    /**
     * Determine node by its location in the main element.
     */


    function _getNodeByLocation(loc) {
      var node = editor.el;

      for (var i = 0; i < loc.length; i++) {
        node = node.childNodes[loc[i]];
      }

      return node;
    }
    /**
     * Restore range from snapshot.
     */


    function _restoreRange(sel, range_snapshot) {
      try {
        // Get range info.
        var startNode = _getNodeByLocation(range_snapshot.scLoc);

        var startOffset = range_snapshot.scOffset;

        var endNode = _getNodeByLocation(range_snapshot.ecLoc);

        var endOffset = range_snapshot.ecOffset; // Restore range.

        var range = editor.doc.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        sel.addRange(range);
      } catch (ex) {// continue regardless of error
      }
    }
    /**
     * Restore snapshot.
     */


    function restore(snapshot) {
      // Restore HTML.
      if (editor.$el.html() !== snapshot.html) {
        if (editor.opts.htmlExecuteScripts) {
          editor.$el.html(snapshot.html);
        } else {
          editor.el.innerHTML = snapshot.html;
        }
      } // Get selection.


      var sel = editor.selection.get(); // Make sure to clear current selection.

      editor.selection.clear(); // Focus.

      editor.events.focus(true); // Restore Ranges.

      for (var i = 0; i < snapshot.ranges.length; i++) {
        _restoreRange(sel, snapshot.ranges[i]);
      }
    }
    /**
     * Compare two snapshots.
     */


    function equal(s1, s2) {
      if (s1.html !== s2.html) {
        return false;
      }

      if (editor.core.hasFocus() && JSON.stringify(s1.ranges) !== JSON.stringify(s2.ranges)) {
        return false;
      }

      return true;
    }

    return {
      get: get,
      restore: restore,
      equal: equal
    };
  };

  FroalaEditor.MODULES.undo = function (editor) {
    /**
     * Disable the default browser undo.
     */
    function _disableBrowserUndo(e) {
      var keyCode = e.which;
      var ctrlKey = editor.keys.ctrlKey(e); // Ctrl Key.

      if (ctrlKey) {
        if (keyCode === FroalaEditor.KEYCODE.Z && e.shiftKey) {
          e.preventDefault();
        }

        if (keyCode === FroalaEditor.KEYCODE.Z) {
          e.preventDefault();
        }
      }
    }

    function canDo() {
      if (editor.undo_stack.length === 0 || editor.undo_index <= 1) {
        return false;
      }

      return true;
    }

    function canRedo() {
      if (editor.undo_index === editor.undo_stack.length) {
        return false;
      }

      return true;
    }

    var last_html = null;

    function saveStep(snapshot) {
      if (!editor.undo_stack || editor.undoing || editor.el.querySelector('.fr-marker')) {
        return;
      }

      if (typeof snapshot === 'undefined') {
        snapshot = editor.snapshot.get();

        if (!editor.undo_stack[editor.undo_index - 1] || !editor.snapshot.equal(editor.undo_stack[editor.undo_index - 1], snapshot)) {
          dropRedo();
          editor.undo_stack.push(snapshot);
          editor.undo_index++;

          if (snapshot.html !== last_html) {
            editor.events.trigger('contentChanged');
            last_html = snapshot.html;
          }
        }
      } else {
        dropRedo();

        if (editor.undo_index > 0) {
          editor.undo_stack[editor.undo_index - 1] = snapshot;
        } else {
          editor.undo_stack.push(snapshot);
          editor.undo_index++;
        }
      }
    }

    function dropRedo() {
      if (!editor.undo_stack || editor.undoing) {
        return;
      }

      while (editor.undo_stack.length > editor.undo_index) {
        editor.undo_stack.pop();
      }
    }

    function _do() {
      if (editor.undo_index > 1) {
        editor.undoing = true; // Get snapshot.

        var snapshot = editor.undo_stack[--editor.undo_index - 1]; // Clear any existing content changed timers.

        clearTimeout(editor._content_changed_timer); // Restore snapshot.

        editor.snapshot.restore(snapshot);
        last_html = snapshot.html; // Hide popups.

        editor.popups.hideAll(); // Enable toolbar.

        editor.toolbar.enable(); // Call content changed.

        editor.events.trigger('contentChanged');
        editor.events.trigger('commands.undo');
        editor.undoing = false;
      }
    }

    function _redo() {
      if (editor.undo_index < editor.undo_stack.length) {
        editor.undoing = true; // Get snapshot.

        var snapshot = editor.undo_stack[editor.undo_index++]; // Clear any existing content changed timers.

        clearTimeout(editor._content_changed_timer); // Restore snapshot.

        editor.snapshot.restore(snapshot);
        last_html = snapshot.html; // Hide popups.

        editor.popups.hideAll(); // Enable toolbar.

        editor.toolbar.enable(); // Call content changed.

        editor.events.trigger('contentChanged');
        editor.events.trigger('commands.redo');
        editor.undoing = false;
      }
    }

    function reset() {
      editor.undo_index = 0;
      editor.undo_stack = [];
    }

    function _destroy() {
      editor.undo_stack = [];
    }
    /**
     * Initialize
     */


    function _init() {
      reset();
      editor.events.on('initialized', function () {
        last_html = (editor.$wp ? editor.$el.html() : editor.$oel.get(0).outerHTML).replace(/ style=""/g, '');
      });
      editor.events.on('blur', function () {
        if (!editor.el.querySelector('.fr-dragging')) {
          editor.undo.saveStep();
        }
      });
      editor.events.on('keydown', _disableBrowserUndo);
      editor.events.on('destroy', _destroy);
    }

    return {
      _init: _init,
      run: _do,
      redo: _redo,
      canDo: canDo,
      canRedo: canRedo,
      dropRedo: dropRedo,
      reset: reset,
      saveStep: saveStep
    };
  };

  Object.assign(FroalaEditor.DEFAULTS, {
    height: null,
    heightMax: null,
    heightMin: null,
    width: null
  });

  FroalaEditor.MODULES.size = function (editor) {
    function syncIframe() {
      refresh();

      if (editor.opts.height) {
        editor.$el.css('minHeight', editor.opts.height - editor.helpers.getPX(editor.$el.css('padding-top')) - editor.helpers.getPX(editor.$el.css('padding-bottom')));
      }

      editor.$iframe.height(editor.$el.outerHeight(true));
    }

    function refresh() {
      if (editor.opts.heightMin) {
        editor.$el.css('minHeight', editor.opts.heightMin);
      } else {
        editor.$el.css('minHeight', '');
      }

      if (editor.opts.heightMax) {
        editor.$wp.css('maxHeight', editor.opts.heightMax);
        editor.$wp.css('overflow', 'auto');
      } else {
        editor.$wp.css('maxHeight', '');
        editor.$wp.css('overflow', '');
      } // Set height.


      if (editor.opts.height) {
        editor.$wp.css('height', editor.opts.height);
        editor.$wp.css('overflow', 'auto');
        editor.$el.css('minHeight', editor.opts.height - editor.helpers.getPX(editor.$el.css('padding-top')) - editor.helpers.getPX(editor.$el.css('padding-bottom')));
      } else {
        editor.$wp.css('height', '');

        if (!editor.opts.heightMin) {
          editor.$el.css('minHeight', '');
        }

        if (!editor.opts.heightMax) {
          editor.$wp.css('overflow', '');
        }
      }

      if (editor.opts.width) {
        editor.$box.width(editor.opts.width);
      }
    }

    function _init() {
      if (!editor.$wp) {
        return false;
      }

      refresh(); // Sync iframe height.

      if (editor.$iframe) {
        editor.events.on('keyup keydown', function () {
          setTimeout(syncIframe, 0);
        }, true);
        editor.events.on('commands.after html.set init initialized paste.after', syncIframe);
      }
    }

    return {
      _init: _init,
      syncIframe: syncIframe,
      refresh: refresh
    };
  };

  Object.assign(FroalaEditor.DEFAULTS, {
    documentReady: false,
    editorClass: null,
    typingTimer: 500,
    iframe: false,
    requestWithCORS: true,
    requestWithCredentials: false,
    requestHeaders: {},
    useClasses: true,
    spellcheck: true,
    iframeDefaultStyle: 'html{margin:0px;height:auto;}body{height:auto;padding:20px;background:transparent;color:#000000;position:relative;z-index: 2;-webkit-user-select:auto;margin:0px;overflow:hidden;min-height:20px;}body:after{content:"";display:block;clear:both;}body::-moz-selection{background:#b5d6fd;color:#000;}body::selection{background:#b5d6fd;color:#000;}',
    iframeStyle: '',
    iframeStyleFiles: [],
    direction: 'auto',
    zIndex: 1,
    tabIndex: null,
    disableRightClick: false,
    scrollableContainer: 'body',
    keepFormatOnDelete: false,
    theme: null
  });

  FroalaEditor.MODULES.core = function (editor) {
    var $ = editor.$;

    function injectStyle(style) {
      if (editor.opts.iframe) {
        editor.$head.find('style[data-fr-style], link[data-fr-style]').remove();
        editor.$head.append("<style data-fr-style=\"true\">".concat(style, "</style>"));

        for (var i = 0; i < editor.opts.iframeStyleFiles.length; i++) {
          var $link = $("<link data-fr-style=\"true\" rel=\"stylesheet\" href=\"".concat(editor.opts.iframeStyleFiles[i], "\">")); // Listen to the load event in order to sync iframe.

          $link.get(0).addEventListener('load', editor.size.syncIframe); // Append to the head.

          editor.$head.append($link);
        }
      }
    }

    function _initElementStyle() {
      if (!editor.opts.iframe) {
        editor.$el.addClass('fr-element fr-view');
      }
    }
    /**
     * Init the editor style.
     */


    function _initStyle() {
      editor.$box.addClass("fr-box".concat(editor.opts.editorClass ? " ".concat(editor.opts.editorClass) : ''));
      editor.$box.attr('role', 'application');
      editor.$wp.addClass('fr-wrapper');

      if (editor.opts.documentReady) {
        editor.$box.addClass('fr-document');
      }

      _initElementStyle();

      if (editor.opts.iframe) {
        editor.$iframe.addClass('fr-iframe');
        editor.$el.addClass('fr-view');

        for (var i = 0; i < editor.o_doc.styleSheets.length; i++) {
          var rules = void 0;

          try {
            rules = editor.o_doc.styleSheets[i].cssRules;
          } catch (ex) {// ok.
          }

          if (rules) {
            for (var idx = 0, len = rules.length; idx < len; idx++) {
              if (rules[idx].selectorText && (rules[idx].selectorText.indexOf('.fr-view') === 0 || rules[idx].selectorText.indexOf('.fr-element') === 0)) {
                if (rules[idx].style.cssText.length > 0) {
                  if (rules[idx].selectorText.indexOf('.fr-view') === 0) {
                    editor.opts.iframeStyle += "".concat(rules[idx].selectorText.replace(/\.fr-view/g, 'body'), "{").concat(rules[idx].style.cssText, "}");
                  } else {
                    editor.opts.iframeStyle += "".concat(rules[idx].selectorText.replace(/\.fr-element/g, 'body'), "{").concat(rules[idx].style.cssText, "}");
                  }
                }
              }
            }
          }
        }
      }

      if (editor.opts.direction !== 'auto') {
        editor.$box.removeClass('fr-ltr fr-rtl').addClass("fr-".concat(editor.opts.direction));
      }

      editor.$el.attr('dir', editor.opts.direction);
      editor.$wp.attr('dir', editor.opts.direction);

      if (editor.opts.zIndex > 1) {
        editor.$box.css('z-index', editor.opts.zIndex);
      }

      if (editor.opts.theme) {
        editor.$box.addClass("".concat(editor.opts.theme, "-theme"));
      } // Set tabIndex option.


      editor.opts.tabIndex = editor.opts.tabIndex || editor.$oel.attr('tabIndex');

      if (editor.opts.tabIndex) {
        editor.$el.attr('tabIndex', editor.opts.tabIndex);
      }
    }
    /**
     * Determine if the editor is empty.
     */


    function isEmpty() {
      return editor.node.isEmpty(editor.el);
    }
    /**
     * Check if the browser allows drag and init it.
     */


    function _initDrag() {
      // Drag and drop support.
      editor.drag_support = {
        filereader: typeof FileReader !== 'undefined',
        formdata: Boolean(editor.win.FormData),
        progress: 'upload' in new XMLHttpRequest()
      };
    }
    /**
     * Return an XHR object.
     */


    function getXHR(url, method) {
      var xhr = new XMLHttpRequest(); // Make it async.

      xhr.open(method, url, true); // Set with credentials.

      if (editor.opts.requestWithCredentials) {
        xhr.withCredentials = true;
      } // Set headers.


      for (var header in editor.opts.requestHeaders) {
        if (Object.prototype.hasOwnProperty.call(editor.opts.requestHeaders, header)) {
          xhr.setRequestHeader(header, editor.opts.requestHeaders[header]);
        }
      }

      return xhr;
    }

    function _destroy(html) {
      if (editor.$oel.get(0).tagName === 'TEXTAREA') {
        editor.$oel.val(html);
      }

      if (editor.$box) {
        editor.$box.removeAttr('role');
      }

      if (editor.$wp) {
        if (editor.$oel.get(0).tagName === 'TEXTAREA') {
          editor.$el.html('');
          editor.$wp.html('');
          editor.$box.replaceWith(editor.$oel);
          editor.$oel.show();
        } else {
          editor.$wp.replaceWith(html);
          editor.$el.html('');
          editor.$box.removeClass("fr-view fr-ltr fr-box ".concat(editor.opts.editorClass || ''));

          if (editor.opts.theme) {
            editor.$box.addClass("".concat(editor.opts.theme, "-theme"));
          }
        }
      }

      this.$wp = null;
      this.$el = null;
      this.el = null;
      this.$box = null;
    }

    function hasFocus() {
      if (editor.browser.mozilla && editor.helpers.isMobile()) {
        return editor.selection.inEditor();
      }

      return editor.node.hasFocus(editor.el) || editor.$el.find('*:focus').length > 0;
    }

    function sameInstance($obj) {
      if (!$obj) {
        return false;
      }

      var inst = $obj.data('instance');
      return inst ? inst.id === editor.id : false;
    }
    /**
     * Tear up.
     */


    function _init() {
      FroalaEditor.INSTANCES.push(editor);

      _initDrag(); // Call initialization methods.


      if (editor.$wp) {
        _initStyle();

        editor.html.set(editor._original_html); // Set spellcheck.

        editor.$el.attr('spellcheck', editor.opts.spellcheck); // Disable autocomplete.

        if (editor.helpers.isMobile()) {
          editor.$el.attr('autocomplete', editor.opts.spellcheck ? 'on' : 'off');
          editor.$el.attr('autocorrect', editor.opts.spellcheck ? 'on' : 'off');
          editor.$el.attr('autocapitalize', editor.opts.spellcheck ? 'on' : 'off');
        } // Disable right click.


        if (editor.opts.disableRightClick) {
          editor.events.$on(editor.$el, 'contextmenu', function (e) {
            if (e.button === 2) {
              return false;
            }
          });
        }

        try {
          editor.doc.execCommand('styleWithCSS', false, false);
        } catch (ex) {// ok.
        }
      }

      if (editor.$oel.get(0).tagName === 'TEXTAREA') {
        // Sync on contentChanged.
        editor.events.on('contentChanged', function () {
          editor.$oel.val(editor.html.get());
        }); // Set HTML on form submit.

        editor.events.on('form.submit', function () {
          editor.$oel.val(editor.html.get());
        });
        editor.events.on('form.reset', function () {
          editor.html.set(editor._original_html);
        });
        editor.$oel.val(editor.html.get());
      } // iOS focus fix.


      if (editor.helpers.isIOS()) {
        editor.events.$on(editor.$doc, 'selectionchange', function () {
          if (!editor.$doc.get(0).hasFocus()) {
            editor.$win.get(0).focus();
          }
        });
      }

      editor.events.trigger('init'); // Autofocus.

      if (editor.opts.autofocus && !editor.opts.initOnClick && editor.$wp) {
        editor.events.on('initialized', function () {
          editor.events.focus(true);
        });
      }
    }

    return {
      _init: _init,
      destroy: _destroy,
      isEmpty: isEmpty,
      getXHR: getXHR,
      injectStyle: injectStyle,
      hasFocus: hasFocus,
      sameInstance: sameInstance
    };
  };

  FroalaEditor.POPUP_TEMPLATES = {
    'text.edit': '[_EDIT_]'
  };

  FroalaEditor.RegisterTemplate = function (name, template) {
    FroalaEditor.POPUP_TEMPLATES[name] = template;
  };

  FroalaEditor.MODULES.popups = function (editor) {
    var $ = editor.$;

    if (!editor.shared.popups) {
      editor.shared.popups = {};
    }

    var popups = editor.shared.popups; // To store active popup buttons

    var $btnActivePopups;

    function setContainer(id, $container) {
      if (!$container.isVisible()) {
        $container = editor.$sc;
      }

      if (!$container.is(popups[id].data('container'))) {
        popups[id].data('container', $container);
        $container.append(popups[id]);
      }
    }

    function refreshContainer(id, $container) {
      if (!$container.isVisible()) {
        $container = editor.$sc;
      }

      if (!$container.contains([popups[id].get(0)])) {
        $container.append(popups[id]);
      }
    }
    /**
     * Handles focus event on input boxes
     */


    function _inputRefreshEmptyOnFocus() {
      $(this).toggleClass('fr-not-empty', true);
    }
    /**
     * Handles blur event on input boxes
     */


    function _inputRefreshEmptyOnBlur() {
      var $elm = $(this);
      $elm.toggleClass('fr-not-empty', $elm.val() !== '');
    }
    /**
     * Remove placeholder and attach label next to input box for focus and blur transitions
     */


    function _addLabel($inputElms) {
      for (var i = 0; i < $inputElms.length; i++) {
        var elm = $inputElms[i];
        var $elm = $(elm); // Attach a label in place of placeholder for input box transition

        var $label = $elm.next();

        if ($label.length === 0 && $elm.attr('placeholder')) {
          $elm.after("<label for=\"".concat($elm.attr('id'), "\">").concat($elm.attr('placeholder'), "</label>")); // Remove placeholder

          $elm.attr('placeholder', '');
        }
      }
    }
    /**
     * Show popup at a specific position.
     */


    function show(id, left, top, obj_height, applyLeftOffset) {
      // Restore selection on show if it is there.
      if (!isVisible(id)) {
        if (areVisible() && editor.$el.find('.fr-marker').length > 0) {
          editor.events.disableBlur();
          editor.selection.restore();
        } else if (!areVisible()) {
          // We must have focus into editor because we may want to save selection.
          editor.events.disableBlur();
          editor.events.focus();
          editor.events.enableBlur();
        }
      }

      hideAll([id]);

      if (!popups[id]) {
        return false;
      } // Hide active dropdowns.


      var $active_dropdowns = editor.button.getButtons('.fr-dropdown.fr-active');
      $active_dropdowns.removeClass('fr-active').attr('aria-expanded', false).parents('.fr-toolbar').css('zIndex', '').find('> .fr-dropdown-wrapper').css('height', '');
      $active_dropdowns.next().attr('aria-hidden', true).css('overflow', '').find('> .fr-dropdown-wrapper').css('height', ''); // Set the current instance for the popup.

      popups[id].data('instance', editor);

      if (editor.$tb) {
        editor.$tb.data('instance', editor);
      }

      var is_visible = isVisible(id);
      popups[id].addClass('fr-active').removeClass('fr-hidden').find('input, textarea').removeAttr('disabled');
      var $container = popups[id].data('container');
      refreshContainer(id, $container); // Inline mode when container is toolbar.

      if (editor.opts.toolbarInline && $container && editor.$tb && $container.get(0) === editor.$tb.get(0)) {
        setContainer(id, editor.$sc);
        top = editor.$tb.offset().top - editor.helpers.getPX(editor.$tb.css('margin-top'));
        left = editor.$tb.offset().left + editor.$tb.outerWidth() / 2;

        if (editor.node.hasClass(editor.$tb.get(0), 'fr-above') && top) {
          top += editor.$tb.outerHeight();
        }

        obj_height = 0;
      } // Apply iframe correction.


      $container = popups[id].data('container');

      if (editor.opts.iframe && !obj_height && !is_visible) {
        var iframePaddingTop = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-top'));
        var iframePaddingLeft = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-left'));

        if (left) {
          left -= editor.$iframe.offset().left + iframePaddingLeft;
        }

        if (top) {
          top -= editor.$iframe.offset().top + iframePaddingTop;
        }
      } // If container is toolbar then increase zindex.


      if ($container.is(editor.$tb)) {
        editor.$tb.css('zIndex', (editor.opts.zIndex || 1) + 4);
      } else {
        popups[id].css('zIndex', (editor.opts.zIndex || 1) + 4);
      } // Toolbar at the bottom and container is toolbar.


      if (editor.opts.toolbarBottom && $container && editor.$tb && $container.get(0) === editor.$tb.get(0)) {
        popups[id].addClass('fr-above');

        if (top) {
          top -= popups[id].outerHeight();
        }
      } // Add popup offset left offset based on the popup width


      if (applyLeftOffset) {
        left -= popups[id].width() / 2;
      } // Check if it exceeds window on the right.


      if (left + popups[id].outerWidth() > editor.$sc.offset().left + editor.$sc.width()) {
        left -= left + popups[id].outerWidth() - editor.$sc.offset().left - editor.$sc.width();
      } // Check if it exceeds window on the left.


      if (left < editor.$sc.offset().left && editor.opts.direction === 'rtl') {
        left = editor.$sc.offset().left;
      } // Position editor.


      popups[id].removeClass('fr-active');
      editor.position.at(left, top, popups[id], obj_height || 0);
      popups[id].addClass('fr-active');

      if (!is_visible) {
        editor.accessibility.focusPopup(popups[id]);
      }

      if (editor.opts.toolbarInline) {
        editor.toolbar.hide();
      } // Update the button for active popup


      if (editor.$tb) {
        $btnActivePopups = editor.$tb.find('.fr-btn-active-popup');
      }

      editor.events.trigger("popups.show.".concat(id)); // https://github.com/froala/wysiwyg-editor/issues/1248

      _events(id)._repositionPopup();

      _unmarkExit();
    }

    function onShow(id, callback) {
      editor.events.on("popups.show.".concat(id), callback);
    }
    /**
     * Find visible popup.
     */


    function isVisible(id) {
      return popups[id] && editor.node.hasClass(popups[id], 'fr-active') && editor.core.sameInstance(popups[id]) || false;
    }
    /**
     * Check if there is any popup visible.
     */


    function areVisible(new_instance) {
      for (var id in popups) {
        if (Object.prototype.hasOwnProperty.call(popups, id)) {
          if (isVisible(id) && (typeof new_instance === 'undefined' || popups[id].data('instance') === new_instance)) {
            return popups[id];
          }
        }
      }

      return false;
    }
    /**
     * Hide popup.
     */


    function hide(id) {
      var $popup = null;

      if (typeof id !== 'string') {
        $popup = id;
      } else {
        $popup = popups[id];
      }

      if ($popup && editor.node.hasClass($popup, 'fr-active')) {
        $popup.removeClass('fr-active fr-above');
        editor.events.trigger("popups.hide.".concat(id)); // Reset toolbar zIndex.

        if (editor.$tb) {
          if (editor.opts.zIndex > 1) {
            editor.$tb.css('zIndex', editor.opts.zIndex + 1);
          } else {
            editor.$tb.css('zIndex', '');
          }
        }

        editor.events.disableBlur();
        $popup.find('input, textarea, button').each(function () {
          if (this === this.ownerDocument.activeElement) {
            this.blur();
          }
        }); // Mark the input boxes as empty

        $popup.find('input, textarea').attr('disabled', 'disabled'); // Remove styling from active popup buttons when popup is closed

        if ($btnActivePopups) {
          for (var index = 0; index < $btnActivePopups.length; index++) {
            $($btnActivePopups[index]).removeClass('fr-btn-active-popup');
          }
        }
      }
    }
    /**
     * Assign an event for hiding.
     */


    function onHide(id, callback) {
      editor.events.on("popups.hide.".concat(id), callback);
    }
    /**
     * Get the popup with the specific id.
     */


    function get(id) {
      var $popup = popups[id];

      if ($popup && !$popup.data("inst".concat(editor.id))) {
        var ev = _events(id);

        _bindInstanceEvents(ev, id);
      }

      return $popup;
    }

    function onRefresh(id, callback) {
      editor.events.on("popups.refresh.".concat(id), callback);
    }
    /**
     * Refresh content inside the popup.
     */


    function refresh(id) {
      // Set the instance id for the popup.
      popups[id].data('instance', editor);
      editor.events.trigger("popups.refresh.".concat(id));
      var btns = popups[id].find('.fr-command');

      for (var i = 0; i < btns.length; i++) {
        var $btn = $(btns[i]);

        if ($btn.parents('.fr-dropdown-menu').length === 0) {
          editor.button.refresh($btn);
        }
      }
    }
    /**
     * Hide all popups.
     */


    function hideAll(except) {
      if (typeof except === 'undefined') {
        except = [];
      }

      for (var id in popups) {
        if (Object.prototype.hasOwnProperty.call(popups, id)) {
          if (except.indexOf(id) < 0) {
            hide(id);
          }
        }
      }
    }

    editor.shared.exit_flag = false;

    function _markExit() {
      editor.shared.exit_flag = true;
    }

    function _unmarkExit() {
      editor.shared.exit_flag = false;
    }

    function _canExit() {
      return editor.shared.exit_flag;
    }

    function _buildTemplate(id, template) {
      // Load template.
      var html = FroalaEditor.POPUP_TEMPLATES[id];

      if (!html) {
        return null;
      }

      if (typeof html === 'function') {
        html = html.apply(editor);
      }

      for (var nm in template) {
        if (Object.prototype.hasOwnProperty.call(template, nm)) {
          html = html.replace("[_".concat(nm.toUpperCase(), "_]"), template[nm]);
        }
      }

      return html;
    }

    function _build(id, template) {
      var $container;

      var html = _buildTemplate(id, template);

      var $popup = $(editor.doc.createElement('DIV'));

      if (!html) {
        $popup.addClass('fr-popup fr-empty');
        $container = $('body').first();
        $container.append($popup);
        $popup.data('container', $container);
        popups[id] = $popup;
        return $popup;
      }

      $popup.addClass("fr-popup".concat(editor.helpers.isMobile() ? ' fr-mobile' : ' fr-desktop').concat(editor.opts.toolbarInline ? ' fr-inline' : ''));
      $popup.html(html);

      if (editor.opts.theme) {
        $popup.addClass("".concat(editor.opts.theme, "-theme"));
      }

      if (editor.opts.zIndex > 1) {
        if (!editor.opts.editInPopup && editor.$tb) {
          editor.$tb.css('z-index', editor.opts.zIndex + 2);
        } else {
          $popup.css('z-index', editor.opts.zIndex + 2);
        }
      }

      if (editor.opts.direction !== 'auto') {
        $popup.removeClass('fr-ltr fr-rtl').addClass("fr-".concat(editor.opts.direction));
      }

      $popup.find('input, textarea').attr('dir', editor.opts.direction).attr('disabled', 'disabled');
      $container = $('body').first();
      $container.append($popup);
      $popup.data('container', $container);
      popups[id] = $popup;
      var $colorHexLayer = $popup.find('.fr-color-hex-layer');

      if ($colorHexLayer.length > 0) {
        var spanWidth = editor.helpers.getPX($popup.find('.fr-color-set > span').css('width'));
        var paddingLeft = editor.helpers.getPX($colorHexLayer.css('paddingLeft'));
        var paddingRight = editor.helpers.getPX($colorHexLayer.css('paddingRight'));
        $colorHexLayer.css('width', spanWidth * editor.opts.colorsStep + paddingLeft + paddingRight);
      } // Bind commands from the popup.


      editor.button.bindCommands($popup, false);
      return $popup;
    }

    function _events(id) {
      var $popup = popups[id];
      return {
        /**
         * Resize window.
         */
        _windowResize: function _windowResize() {
          var inst = $popup.data('instance') || editor;

          if (!inst.helpers.isMobile() && $popup.isVisible()) {
            inst.events.disableBlur();
            inst.popups.hide(id);
            inst.events.enableBlur();
          }
        },

        /**
         * Focus on an input.
         */
        _inputFocus: function _inputFocus(e) {
          var inst = $popup.data('instance') || editor;
          var $target = $(e.currentTarget);

          if ($target.is('input:file')) {
            $target.closest('.fr-layer').addClass('fr-input-focus');
          }

          e.preventDefault();
          e.stopPropagation(); // IE workaround.

          setTimeout(function () {
            inst.events.enableBlur();
          }, 100); // Reposition scroll on mobile to the original one.

          if (inst.helpers.isMobile()) {
            var t = $(inst.o_win).scrollTop();
            setTimeout(function () {
              $(inst.o_win).scrollTop(t);
            }, 0);
          }
        },

        /**
         * Blur on an input.
         */
        _inputBlur: function _inputBlur(e) {
          var inst = $popup.data('instance') || editor;
          var $target = $(e.currentTarget);

          if ($target.is('input:file')) {
            $target.closest('.fr-layer').removeClass('fr-input-focus');
          } // Do not do blur on window change.


          if (document.activeElement !== this && $(this).isVisible()) {
            if (inst.events.blurActive()) {
              inst.events.trigger('blur');
            }

            inst.events.enableBlur();
          }
        },

        /**
         * Editor keydown.
         */
        _editorKeydown: function _editorKeydown(e) {
          var inst = $popup.data('instance') || editor; // ESC.

          if (!inst.keys.ctrlKey(e) && e.which !== FroalaEditor.KEYCODE.ALT && e.which !== FroalaEditor.KEYCODE.ESC) {
            if (isVisible(id) && $popup.findVisible('.fr-back').length) {
              inst.button.exec($popup.findVisible('.fr-back').first());
            } // Don't hide if alt alone is pressed to allow Alt + F10 shortcut for accessibility.
            else if (e.which !== FroalaEditor.KEYCODE.ALT) {
                inst.popups.hide(id);
              }
          }
        },

        /**
         * Handling hitting the popup elements with the mouse.
         */
        _preventFocus: function _preventFocus(e) {
          var inst = $popup.data('instance') || editor; // Get the original target.

          var originalTarget = e.originalEvent ? e.originalEvent.target || e.originalEvent.originalTarget : null; // Do not disable blur on mouseup because it is the last event in the chain.

          if (e.type !== 'mouseup' && !$(originalTarget).is(':focus')) {
            inst.events.disableBlur();
          } // Hide popup's active dropdowns on mouseup.


          if (e.type === 'mouseup' && !($(originalTarget).hasClass('fr-command') || $(originalTarget).parents('.fr-command').length > 0) && !$(originalTarget).hasClass('fr-dropdown-content')) {
            editor.button.hideActiveDropdowns($popup);
          } // https://github.com/froala/wysiwyg-editor/issues/1733
          // https://github.com/froala/wysiwyg-editor/issues/1838 . Firefox: with Jquery > 2 $(originalTarget).is(':focus') returns the oposite to Jquery < 2.


          if ((editor.browser.safari || editor.browser.mozilla) && e.type === 'mousedown' && $(originalTarget).is('input[type=file]')) {
            inst.events.disableBlur();
          } // Define the input selector.


          var input_selector = 'input, textarea, button, select, label, .fr-command'; // Click was not made inside an input.

          if (originalTarget && !$(originalTarget).is(input_selector) && $(originalTarget).parents(input_selector).length === 0) {
            e.stopPropagation();
            return false;
          } // Click was made on another input inside popup. Prevent propagation of the event.
          else if (originalTarget && $(originalTarget).is(input_selector)) {
              e.stopPropagation();
            }

          _unmarkExit();
        },

        /**
         * Mouseup inside the editor.
         */
        _editorMouseup: function _editorMouseup() {
          // Check if popup is visible and we can exit.
          if ($popup.isVisible() && _canExit()) {
            // If we have an input focused, then disable blur.
            if ($popup.findVisible('input:focus, textarea:focus, button:focus, select:focus').length > 0) {
              editor.events.disableBlur();
            }
          }
        },

        /**
         * Mouseup on window.
         */
        _windowMouseup: function _windowMouseup(e) {
          if (!editor.core.sameInstance($popup)) {
            return true;
          }

          var inst = $popup.data('instance') || editor;

          if ($popup.isVisible() && _canExit()) {
            e.stopPropagation();
            inst.markers.remove();
            inst.popups.hide(id);

            _unmarkExit();
          }
        },

        /**
         * Keydown on window.
         */
        _windowKeydown: function _windowKeydown(e) {
          if (!editor.core.sameInstance($popup)) {
            return true;
          }

          var inst = $popup.data('instance') || editor;
          var key_code = e.which; // ESC.

          if (FroalaEditor.KEYCODE.ESC === key_code) {
            if (inst.popups.isVisible(id) && inst.opts.toolbarInline) {
              e.stopPropagation();

              if (inst.popups.isVisible(id)) {
                if ($popup.findVisible('.fr-back').length) {
                  inst.button.exec($popup.findVisible('.fr-back').first()); // Focus back popup button.

                  inst.accessibility.focusPopupButton($popup);
                } else if ($popup.findVisible('.fr-dismiss').length) {
                  inst.button.exec($popup.findVisible('.fr-dismiss').first());
                } else {
                  inst.popups.hide(id);
                  inst.toolbar.showInline(null, true); // Focus back popup button.

                  inst.accessibility.focusPopupButton($popup);
                }
              }

              return false;
            } else if (inst.popups.isVisible(id)) {
              if ($popup.findVisible('.fr-back').length) {
                inst.button.exec($popup.findVisible('.fr-back').first); // Focus back popup button.

                inst.accessibility.focusPopupButton($popup);
              } else if ($popup.findVisible('.fr-dismiss').length) {
                inst.button.exec($popup.findVisible('.fr-dismiss').first());
              } else {
                inst.popups.hide(id); // Focus back popup button.

                inst.accessibility.focusPopupButton($popup);
              }

              return false;
            }
          }
        },

        /**
         * Reposition popup.
         */
        _repositionPopup: function _repositionPopup() {
          // No height set or toolbar inline.
          if (!(editor.opts.height || editor.opts.heightMax) || editor.opts.toolbarInline) {
            return true;
          }

          if (editor.$wp && isVisible(id) && $popup.parent().get(0) === editor.$sc.get(0)) {
            // Popup top - wrapper top.
            var p_top = $popup.offset().top - editor.$wp.offset().top; // Wrapper height.

            var w_height = editor.$wp.outerHeight();

            if (editor.node.hasClass($popup.get(0), 'fr-above')) {
              p_top += $popup.outerHeight();
            } // 1. Popup top > w_height.
            // 2. Popup top + popup height < 0.


            if (p_top > w_height || p_top < 0) {
              $popup.addClass('fr-hidden');
            } else {
              $popup.removeClass('fr-hidden');
            }
          }
        }
      };
    }

    function _bindInstanceEvents(ev, id) {
      // Editor mouseup.
      editor.events.on('mouseup', ev._editorMouseup, true);

      if (editor.$wp) {
        editor.events.on('keydown', ev._editorKeydown);
      } // Hide all popups on blur.


      editor.events.on('blur', function () {
        if (areVisible()) {
          editor.markers.remove();
        } // https://github.com/froala-labs/froala-editor-js-2/issues/858


        if (!popups[id].find('iframe').length) {
          hideAll();
        }
      }); // Update the position of the popup.

      if (editor.$wp && !editor.helpers.isMobile()) {
        editor.events.$on(editor.$wp, "scroll.popup".concat(id), ev._repositionPopup);
      }

      editor.events.on('window.mouseup', ev._windowMouseup, true);
      editor.events.on('window.keydown', ev._windowKeydown, true);
      popups[id].data("inst".concat(editor.id), true);
      editor.events.on('destroy', function () {
        if (editor.core.sameInstance(popups[id])) {
          $('body').first().append(popups[id]);
          popups[id].removeClass('fr-active');
        }
      }, true);
    }
    /**
     * Handles a checkbox label click event
     */


    function _checkboxLabelClick() {
      // Get checkbox next to the label
      var $checkbox = $(this).prev().children().first(); // Toggle the checkbox

      $checkbox.attr('checked', !$checkbox.attr('checked'));
    }
    /**
     * Create a popup.
     */


    function create(id, template) {
      var $popup = _build(id, template); // Build events.


      var ev = _events(id); // Events binded here should be assigned in every instace.


      _bindInstanceEvents(ev, id); // Input Focus / Blur / Keydown.


      editor.events.$on($popup, 'mousedown mouseup touchstart touchend touch', '*', ev._preventFocus, true);
      editor.events.$on($popup, 'focus', 'input, textarea, button, select', ev._inputFocus, true);
      editor.events.$on($popup, 'blur', 'input, textarea, button, select', ev._inputBlur, true); // Attach focus and blur events for transitions

      var $labelElms = $popup.find('input, textarea');

      _addLabel($labelElms);

      editor.events.$on($labelElms, 'focus', _inputRefreshEmptyOnFocus);
      editor.events.$on($labelElms, 'blur change', _inputRefreshEmptyOnBlur); // Toggle the checkbox on click on label

      editor.events.$on($popup, 'click', '.fr-checkbox + label', _checkboxLabelClick); // Register popup to handle keyboard accessibility.

      editor.accessibility.registerPopup(id); // Toggle checkbox.

      if (editor.helpers.isIOS()) {
        editor.events.$on($popup, 'touchend', 'label', function () {
          $("#".concat($(this).attr('for'))).prop('checked', function (i, val) {
            return !val;
          });
        }, true);
      } // Window mouseup.


      editor.events.$on($(editor.o_win), 'resize', ev._windowResize, true);
      return $popup;
    }
    /**
     * Destroy.
     */


    function _destroy() {
      for (var id in popups) {
        if (Object.prototype.hasOwnProperty.call(popups, id)) {
          var $popup = popups[id];

          if ($popup) {
            $popup.html('').removeData().remove();
            popups[id] = null;
          }
        }
      }

      popups = [];
    }
    /**
     * Initialization.
     */


    function _init() {
      editor.events.on('shared.destroy', _destroy, true);
      editor.events.on('window.mousedown', _markExit);
      editor.events.on('window.touchmove', _unmarkExit); // Prevent hiding popups while we scroll.

      editor.events.$on($(editor.o_win), 'scroll', _unmarkExit);
      editor.events.on('mousedown', function (e) {
        if (areVisible()) {
          e.stopPropagation(); // Remove markers.

          editor.$el.find('.fr-marker').remove(); // Prepare for exit.

          _markExit(); // Disable blur.


          editor.events.disableBlur();
        }
      });
    }

    return {
      _init: _init,
      create: create,
      get: get,
      show: show,
      hide: hide,
      onHide: onHide,
      hideAll: hideAll,
      setContainer: setContainer,
      refresh: refresh,
      onRefresh: onRefresh,
      onShow: onShow,
      isVisible: isVisible,
      areVisible: areVisible
    };
  };

  FroalaEditor.MODULES.accessibility = function (editor) {
    var $ = editor.$; // Flag to tell if mouseenter can blur popup elements with tabindex. This is in case that popup shows over the cursor so mouseenter should not blur immediately.
    // FireFox issue.

    var can_blur = true;
    /*
     * Focus an element.
     */

    function focusToolbarElement($el) {
      // Check if it is empty.
      // https://github.com/froala/wysiwyg-editor/issues/2427.
      if (!$el || !$el.length || editor.$el.find('[contenteditable="true"]').is(':focus')) {
        return;
      } // Add blur event handler on the element that do not reside on a popup.


      if (!$el.data('blur-event-set') && !$el.parents('.fr-popup').length) {
        // Set shared event for blur on element because it resides in a popup.
        editor.events.$on($el, 'blur', function () {
          // Get current instance.
          var inst = $el.parents('.fr-toolbar, .fr-popup').data('instance') || editor; // Check if we should actually trigger blur.

          if (inst.events.blurActive() && !editor.core.hasFocus()) {
            inst.events.trigger('blur');
          } // Allow blur.
          // IE hack.


          setTimeout(function () {
            inst.events.enableBlur();
          }, 100);
        }, true);
        $el.data('blur-event-set', true);
      } // Get current instance.


      var inst = $el.parents('.fr-toolbar, .fr-popup').data('instance') || editor; // Do not allow blur on the editor until element focus.

      inst.events.disableBlur();
      $el.get(0).focus(); // Store it as the current focused element.

      editor.shared.$f_el = $el;
    }
    /*
     * Focus first or last toolbar button.
     */


    function focusToolbar($tb, last) {
      var position = last ? 'last' : 'first'; // Get all toobar buttons.
      // Re-order the toolbar buttons

      var $btn = _reorderToolbarButtons(_getVisibleToolbarButtons($tb))[position]();

      if ($btn.length) {
        focusToolbarElement($btn);
        return true;
      }
    }
    /*
     * Focus a popup content element.
     */


    function focusContentElement($el) {
      // Save editor selection only if the element we want to focus is input text or textarea.
      if ($el.is('input, textarea, select')) {
        saveSelection();
      }

      editor.events.disableBlur();
      $el.get(0).focus();
      return true;
    }
    /*
     * Focus popup's content.
     */


    function focusContent($content, backward) {
      // First input.
      var $first_input = $content.find('input, textarea, button, select').filter(function () {
        return $(this).isVisible();
      }).not(':disabled');
      $first_input = backward ? $first_input.last() : $first_input.first();

      if ($first_input.length) {
        return focusContentElement($first_input);
      }

      if (editor.shared.with_kb) {
        // Active item.
        var $active_item = $content.findVisible('.fr-active-item').first();

        if ($active_item.length) {
          return focusContentElement($active_item);
        } // First element with tabindex.


        var $first_tab_index = $content.findVisible('[tabIndex]').first();

        if ($first_tab_index.length) {
          return focusContentElement($first_tab_index);
        }
      }
    }

    function saveSelection() {
      if (editor.$el.find('.fr-marker').length === 0 && editor.core.hasFocus()) {
        editor.selection.save();
      }
    }

    function restoreSelection() {
      // Restore selection.
      if (editor.$el.find('.fr-marker').length) {
        editor.events.disableBlur();
        editor.selection.restore();
        editor.events.enableBlur();
      }
    }
    /*
     * Focus popup.
     */


    function focusPopup($popup) {
      // Get popup content without fr-buttons toolbar.
      var $popup_content = $popup.children().not('.fr-buttons'); // Blur popup on mouseenter.

      if (!$popup_content.data('mouseenter-event-set')) {
        editor.events.$on($popup_content, 'mouseenter', '[tabIndex]', function (e) {
          var inst = $popup.data('instance') || editor; // FireFox issue.

          if (!can_blur) {
            // Popup showed over the cursor.
            e.stopPropagation();
            e.preventDefault();
            return;
          }

          var $focused_item = $popup_content.find(':focus').first();

          if ($focused_item.length && !$focused_item.is('input, button, textarea, select')) {
            inst.events.disableBlur();
            $focused_item.blur();
            inst.events.disableBlur();
            inst.events.focus();
          }
        });
        $popup_content.data('mouseenter-event-set', true);
      } // Focus content if possible, else focus toolbar if the popup is opened with keyboard.


      if (!focusContent($popup_content) && editor.shared.with_kb) {
        focusToolbar($popup.find('.fr-buttons'));
      }
    }
    /*
     * Focus modal.
     */


    function focusModal($modal) {
      // Make sure we have focus on editing area.
      if (!editor.core.hasFocus()) {
        editor.events.disableBlur();
        editor.events.focus();
      } // Save selection.


      editor.accessibility.saveSelection();
      editor.events.disableBlur(); // Blur editor and clear selection to enable arrow keys scrolling.

      editor.el.blur();
      editor.selection.clear();
      editor.events.disableBlur();

      if (editor.shared.with_kb) {
        $modal.find('.fr-command[tabIndex], [tabIndex]').first().focus();
      } else {
        $modal.find('[tabIndex]').first().focus();
      }
    }
    /*
     * Focus popup toolbar or main toolbar.
     */


    function focusToolbars() {
      // Look for active popup.
      var $popup = editor.popups.areVisible();

      if ($popup) {
        var $tb = $popup.find('.fr-buttons');

        if (!$tb.find('button:focus, .fr-group span:focus').length) {
          return !focusToolbar($tb);
        }

        return !focusToolbar($popup.data('instance').$tb);
      } // Focus main toolbar if no others were found.


      return !focusToolbar(editor.$tb);
    }
    /*
     * Get the dropdown button that is active and is focused or is active and its commands are focused.
     */


    function _getActiveFocusedDropdown() {
      var $activeDropdown = null; // Is active and focused.

      if (editor.shared.$f_el.is('.fr-dropdown.fr-active')) {
        $activeDropdown = editor.shared.$f_el;
      } // Is active and its commands are focused. editor.shared.$f_el is a dropdown command.
      else if (editor.shared.$f_el.closest('.fr-dropdown-menu').prev().is('.fr-dropdown.fr-active')) {
          $activeDropdown = editor.shared.$f_el.closest('.fr-dropdown-menu').prev();
        }

      return $activeDropdown;
    }
    /**
     * Insert the more toolbar buttons after its corresponding more button
     */


    function _reorderToolbarButtons($buttons) {
      // Get the more button position
      var moreBtnIndex = -1;

      for (var i = 0; i < $buttons.length; i++) {
        if ($($buttons[i]).hasClass('fr-open')) {
          moreBtnIndex = i;
        }
      } // Get first open more toolbar button position


      var firstMoreToolbarBtnIndex = $buttons.index(editor.$tb.find('.fr-more-toolbar.fr-expanded > button.fr-command').first()); // If atleast one more toolbar is expanded

      if (firstMoreToolbarBtnIndex > 0 && moreBtnIndex !== -1) {
        // Insert the more toolbar buttons after its more button
        var $moreToolbarBtns = $buttons.slice(firstMoreToolbarBtnIndex, $buttons.length);
        $buttons = $buttons.slice(0, firstMoreToolbarBtnIndex);
        var left = $buttons.slice(0, moreBtnIndex + 1);
        var right = $buttons.slice(moreBtnIndex + 1, $buttons.length);
        $buttons = left;

        for (var _i = 0; _i < $moreToolbarBtns.length; _i++) {
          $buttons.push($moreToolbarBtns[_i]);
        }

        for (var _i2 = 0; _i2 < right.length; _i2++) {
          $buttons.push(right[_i2]);
        }
      }

      return $buttons;
    }
    /**
     * Returns the visible toolbar buttons
     */


    function _getVisibleToolbarButtons($tb) {
      return $tb.findVisible('button:not(.fr-disabled), .fr-group span.fr-command').filter(function (btn) {
        var $moreToolbar = $(btn).parents('.fr-more-toolbar'); // Remove all the buttons which are not part of the open more toolbar

        return $moreToolbar.length === 0 || $moreToolbar.length > 0 && $moreToolbar.hasClass('fr-expanded');
      });
    }

    function _moveHorizontally($tb, tab_key, forward) {
      if (editor.shared.$f_el) {
        var $activeDropdown = _getActiveFocusedDropdown(); // A focused active dropdown button.


        if ($activeDropdown) {
          // Unclick.
          editor.button.click($activeDropdown);
          editor.shared.$f_el = $activeDropdown;
        } // Focus the next/previous button.
        // Get all toobar buttons.
        // Re-order the toolbar buttons


        var $buttons = _reorderToolbarButtons(_getVisibleToolbarButtons($tb)); // Get focused button position.


        var index = $buttons.index(editor.shared.$f_el); // Last or first button reached.

        if (index === 0 && !forward || index === $buttons.length - 1 && forward) {
          var status; // Focus content if last or first toolbar button is reached.

          if (tab_key) {
            if ($tb.parent().is('.fr-popup')) {
              var $popup_content = $tb.parent().children().not('.fr-buttons');
              status = !focusContent($popup_content, !forward);
            }

            if (status === false) {
              editor.shared.$f_el = null;
            }
          } // Arrow used or popup listeners were not active.


          if (!tab_key || status !== false) {
            // Focus to the opposite side button of the toolbar.
            focusToolbar($tb, !forward);
          }
        } else {
          // Focus next or previous button.
          focusToolbarElement($($buttons.get(index + (forward ? 1 : -1))));
        }

        return false;
      }
    }

    function moveForward($tb, tab_key) {
      return _moveHorizontally($tb, tab_key, true);
    }

    function moveBackward($tb, tab_key) {
      return _moveHorizontally($tb, tab_key);
    }

    function _moveVertically(down) {
      if (editor.shared.$f_el) {
        var $destination; // Dropdown button.

        if (editor.shared.$f_el.is('.fr-dropdown.fr-active')) {
          // Focus the first/last dropdown command.
          if (down) {
            $destination = editor.shared.$f_el.next().find('.fr-command:not(.fr-disabled)').first();
          } else {
            $destination = editor.shared.$f_el.next().find('.fr-command:not(.fr-disabled)').last();
          }

          focusToolbarElement($destination);
          return false;
        } // Dropdown command.
        else if (editor.shared.$f_el.is('a.fr-command')) {
            // Focus the previous/next dropdown command.
            if (down) {
              $destination = editor.shared.$f_el.closest('li').nextAllVisible().first().find('.fr-command:not(.fr-disabled)').first();
            } else {
              $destination = editor.shared.$f_el.closest('li').prevAllVisible().first().find('.fr-command:not(.fr-disabled)').first();
            } // Last or first button reached: Focus to the opposite side element of the dropdown.


            if (!$destination.length) {
              if (down) {
                $destination = editor.shared.$f_el.closest('.fr-dropdown-menu').find('.fr-command:not(.fr-disabled)').first();
              } else {
                $destination = editor.shared.$f_el.closest('.fr-dropdown-menu').find('.fr-command:not(.fr-disabled)').last();
              }
            }

            focusToolbarElement($destination);
            return false;
          }
      }
    }

    function moveDown() {
      // Also enable dropdown opening on arrow down.
      if (editor.shared.$f_el && editor.shared.$f_el.is('.fr-dropdown:not(.fr-active)')) {
        return enter();
      }

      return _moveVertically(true);
    }

    function moveUp() {
      return _moveVertically();
    }

    function enter() {
      if (editor.shared.$f_el) {
        // Check if the focused element is a dropdown button.
        if (editor.shared.$f_el.hasClass('fr-dropdown')) {
          // Do click and focus the first dropdown item.
          editor.button.click(editor.shared.$f_el);
        } else if (editor.shared.$f_el.is('button.fr-back')) {
          if (editor.opts.toolbarInline) {
            editor.events.disableBlur();
            editor.events.focus();
          }

          var $popup = editor.popups.areVisible(editor); // Previous popup will show up so we need to not default focus the popup because back popup button have to be focused.

          if ($popup) {
            editor.shared.with_kb = false;
          }

          editor.button.click(editor.shared.$f_el); // Focus back popup button.

          focusPopupButton($popup);
        } else {
          editor.events.disableBlur();
          editor.button.click(editor.shared.$f_el); // If it is a more button

          if (editor.shared.$f_el.attr('data-group-name')) {
            // Focus the first active button in the more toolbar only if the more toolbar is open
            var $moreToolbar = editor.$tb.find(".fr-more-toolbar[data-name=\"".concat(editor.shared.$f_el.attr('data-group-name'), "\"]"));
            var $btn = editor.shared.$f_el;

            if ($moreToolbar.hasClass('fr-expanded')) {
              $btn = $moreToolbar.findVisible('button:not(.fr-disabled)')['first']();
            }

            if ($btn) {
              focusToolbarElement($btn);
            }
          } else if (editor.shared.$f_el.attr('data-popup')) {
            // Attach button to visible popup.
            var $visible_popup = editor.popups.areVisible(editor);

            if ($visible_popup) {
              $visible_popup.data('popup-button', editor.shared.$f_el);
            }
          } else if (editor.shared.$f_el.attr('data-modal')) {
            // Attach button to visible modal.
            var $visible_modal = editor.modals.areVisible(editor);

            if ($visible_modal) {
              $visible_modal.data('modal-button', editor.shared.$f_el);
            }
          }

          editor.shared.$f_el = null;
        }

        return false;
      }
    }

    function focusEditor() {
      if (editor.shared.$f_el) {
        editor.events.disableBlur();
        editor.shared.$f_el.blur();
        editor.shared.$f_el = null;
      } // Trigger custom behavior.


      if (editor.events.trigger('toolbar.focusEditor') === false) {
        return;
      }

      editor.events.disableBlur();
      editor.$el.get(0).focus();
      editor.events.focus();
    }

    function esc($tb) {
      if (editor.shared.$f_el) {
        var $activeDropdown = _getActiveFocusedDropdown(); // Active focused dropdown.


        if ($activeDropdown) {
          // Unclick.
          editor.button.click($activeDropdown); // Focus the unactive dropdown.

          focusToolbarElement($activeDropdown);
        } // Toolbar contains a back button.
        else if ($tb.parent().findVisible('.fr-back').length) {
            editor.shared.with_kb = false;

            if (editor.opts.toolbarInline) {
              // Toolbar inline needs focus in order to show up.
              editor.events.disableBlur();
              editor.events.focus();
            }

            editor.button.exec($tb.parent().findVisible('.fr-back')).first(); // Focus back popup button.

            focusPopupButton($tb.parent());
          } // A toolbar that gets opened from the editable area.
          else if (editor.shared.$f_el.is('button, .fr-group span')) {
              if ($tb.parent().is('.fr-popup')) {
                // Restore selection.
                editor.accessibility.restoreSelection();
                editor.shared.$f_el = null; // Trigger custom behaviour.

                if (editor.events.trigger('toolbar.esc') !== false) {
                  // Default behaviour.
                  // Hide popup.
                  editor.popups.hide($tb.parent()); // Show inline toolbar.

                  if (editor.opts.toolbarInline) {
                    editor.toolbar.showInline(null, true);
                  } // Focus back popup button.


                  focusPopupButton($tb.parent());
                }
              } else {
                focusEditor();
              }
            }

        return false;
      }
    }
    /*
     * Execute shortcut.
     */


    function exec(e, $tb) {
      var ctrlKey = navigator.userAgent.indexOf('Mac OS X') !== -1 ? e.metaKey : e.ctrlKey;
      var keycode = e.which;
      var status = false; // Tab.

      if (keycode === FroalaEditor.KEYCODE.TAB && !ctrlKey && !e.shiftKey && !e.altKey) {
        status = moveForward($tb, true);
      } // Arrow right -> .
      else if (keycode === FroalaEditor.KEYCODE.ARROW_RIGHT && !ctrlKey && !e.shiftKey && !e.altKey) {
          status = moveForward($tb);
        } // Shift + Tab.
        else if (keycode === FroalaEditor.KEYCODE.TAB && !ctrlKey && e.shiftKey && !e.altKey) {
            status = moveBackward($tb, true);
          } // Arrow left <- .
          else if (keycode === FroalaEditor.KEYCODE.ARROW_LEFT && !ctrlKey && !e.shiftKey && !e.altKey) {
              status = moveBackward($tb);
            } // Arrow up.
            else if (keycode === FroalaEditor.KEYCODE.ARROW_UP && !ctrlKey && !e.shiftKey && !e.altKey) {
                status = moveUp();
              } // Arrow down.
              else if (keycode === FroalaEditor.KEYCODE.ARROW_DOWN && !ctrlKey && !e.shiftKey && !e.altKey) {
                  status = moveDown();
                } // Enter.
                else if ((keycode === FroalaEditor.KEYCODE.ENTER || keycode === FroalaEditor.KEYCODE.SPACE) && !ctrlKey && !e.shiftKey && !e.altKey) {
                    status = enter();
                  } // Esc.
                  else if (keycode === FroalaEditor.KEYCODE.ESC && !ctrlKey && !e.shiftKey && !e.altKey) {
                      status = esc($tb);
                    } // Alt + F10.
                    else if (keycode === FroalaEditor.KEYCODE.F10 && !ctrlKey && !e.shiftKey && e.altKey) {
                        status = focusToolbars();
                      } // No focused element and no action done. Eg: popup is opened.


      if (!editor.shared.$f_el && typeof status === 'undefined') {
        status = true;
      } // Check if key event is a browser action. Eg: Ctrl + R.


      if (!status && editor.keys.isBrowserAction(e)) {
        status = true;
      } // Propagate to the next key listeners.


      if (status) {
        return true;
      }

      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    /*
     * Register a toolbar to keydown event.
     */


    function registerToolbar($tb) {
      if (!$tb || !$tb.length) {
        return;
      } // Hitting keydown on toolbar.


      editor.events.$on($tb, 'keydown', function (e) {
        // Allow only buttons.fr-command.
        if (!$(e.target).is('a.fr-command, button.fr-command, .fr-group span.fr-command')) {
          return true;
        } // Get the current editor instance for the popup.


        var inst = $tb.parents('.fr-popup').data('instance') || $tb.data('instance') || editor; // Keyboard used.

        editor.shared.with_kb = true;
        var status = inst.accessibility.exec(e, $tb);
        editor.shared.with_kb = false;
        return status;
      }, true); // Unfocus the toolbar on mouseenter.

      editor.events.$on($tb, 'mouseenter', '[tabIndex]', function (e) {
        var inst = $tb.parents('.fr-popup').data('instance') || $tb.data('instance') || editor; // FireFox issue.

        if (!can_blur) {
          // Popup showed over the cursor.
          e.stopPropagation();
          e.preventDefault();
          return;
        }

        var $hovered_el = $(e.currentTarget);

        if (inst.shared.$f_el && inst.shared.$f_el.not($hovered_el)) {
          inst.accessibility.focusEditor();
        }
      }, true); // Update the focused shared variable after every transition

      if (editor.$tb) {
        editor.events.$on(editor.$tb, 'transitionend', '.fr-more-toolbar', function () {
          editor.shared.$f_el = $(document.activeElement);
        });
      }
    }
    /*
     * Register a popup to a keydown event.
     */


    function registerPopup(id) {
      var $popup = editor.popups.get(id);

      var ev = _getPopupEvents(id); // Register popup toolbar.


      registerToolbar($popup.find('.fr-buttons')); // Clear popup button on mouseenter.

      editor.events.$on($popup, 'mouseenter', 'tabIndex', ev._tiMouseenter, true); // Keydown handler on every element that has tabIndex.

      editor.events.$on($popup.children().not('.fr-buttons'), 'keydown', '[tabIndex]', ev._tiKeydown, true); // Restore selection on popups hide for the current active popup.

      editor.popups.onHide(id, function () {
        var inst = $popup.data('instance') || editor;
        inst.accessibility.restoreSelection();
      }); // FireFox issue: Prevent immediate popup bluring. Popup could show up over the cursor.

      editor.popups.onShow(id, function () {
        can_blur = false;
        setTimeout(function () {
          can_blur = true;
        }, 0);
      });
    }
    /*
     * Get popup events.
     */


    function _getPopupEvents(id) {
      var $popup = editor.popups.get(id);
      return {
        /**
         * Keydown on an input.
         */
        _tiKeydown: function _tiKeydown(e) {
          var inst = $popup.data('instance') || editor; // See if plugins listeners are active.

          if (inst.events.trigger('popup.tab', [e]) === false) {
            return false;
          }

          var key_code = e.which;
          var $focused_item = $popup.find(':focus').first(); // Tabbing.

          if (FroalaEditor.KEYCODE.TAB === key_code) {
            e.preventDefault(); // Focus next/previous input.

            var $popup_content = $popup.children().not('.fr-buttons');
            var inputs = $popup_content.findVisible('input, textarea, button, select').not('.fr-no-touch input, .fr-no-touch textarea, .fr-no-touch button, .fr-no-touch select, :disabled').toArray();
            var idx = inputs.indexOf(this) + (e.shiftKey ? -1 : 1);

            if (idx >= 0 && idx < inputs.length) {
              inst.events.disableBlur();
              $(inputs[idx]).focus();
              e.stopPropagation();
              return false;
            } // Focus toolbar.


            var $tb = $popup.find('.fr-buttons');

            if ($tb.length && focusToolbar($tb, Boolean(e.shiftKey))) {
              e.stopPropagation();
              return false;
            } // Focus content.


            if (focusContent($popup_content)) {
              e.stopPropagation();
              return false;
            }
          } // ENTER.
          else if (FroalaEditor.KEYCODE.ENTER === key_code && e.target && e.target.tagName !== 'TEXTAREA') {
              var $active_button = null;

              if ($popup.findVisible('.fr-submit').length > 0) {
                $active_button = $popup.findVisible('.fr-submit').first();
              } else if ($popup.findVisible('.fr-dismiss').length) {
                $active_button = $popup.findVisible('.fr-dismiss').first();
              }

              if ($active_button) {
                e.preventDefault();
                e.stopPropagation();
                inst.events.disableBlur();
                inst.button.exec($active_button);
              }
            } // ESC.
            else if (FroalaEditor.KEYCODE.ESC === key_code) {
                e.preventDefault();
                e.stopPropagation(); // Restore selection.

                inst.accessibility.restoreSelection();

                if (inst.popups.isVisible(id) && $popup.findVisible('.fr-back').length) {
                  if (inst.opts.toolbarInline) {
                    // Toolbar inline needs focus in order to show up.
                    inst.events.disableBlur();
                    inst.events.focus();
                  }

                  inst.button.exec($popup.findVisible('.fr-back').first()); // Focus back popup button.

                  focusPopupButton($popup);
                } else if (inst.popups.isVisible(id) && $popup.findVisible('.fr-dismiss').length) {
                  inst.button.exec($popup.findVisible('.fr-dismiss').first());
                } else {
                  inst.popups.hide(id);

                  if (inst.opts.toolbarInline) {
                    inst.toolbar.showInline(null, true);
                  } // Focus back popup button.


                  focusPopupButton($popup);
                }

                return false;
              } // Allow space.
              else if (FroalaEditor.KEYCODE.SPACE === key_code && ($focused_item.is('.fr-submit') || $focused_item.is('.fr-dismiss'))) {
                  e.preventDefault();
                  e.stopPropagation();
                  inst.events.disableBlur();
                  inst.button.exec($focused_item);
                  return true;
                } // Other KEY. Stop propagation to the window.
                else {
                    // Check if key event is a browser action. Eg: Ctrl + R.
                    if (inst.keys.isBrowserAction(e)) {
                      e.stopPropagation();
                      return;
                    }

                    if ($focused_item.is('input[type=text], textarea')) {
                      e.stopPropagation();
                      return;
                    }

                    if (FroalaEditor.KEYCODE.SPACE === key_code && ($focused_item.is('.fr-link-attr') || $focused_item.is('input[type=file]'))) {
                      e.stopPropagation();
                      return;
                    }

                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                  }
        },
        _tiMouseenter: function _tiMouseenter() {
          var inst = $popup.data('instance') || editor;

          _clearPopupButton(inst);
        }
      };
    }
    /*
     * Focus the button from which the popup was showed.
     */


    function focusPopupButton($popup) {
      var $popup_button = $popup.data('popup-button');

      if ($popup_button) {
        setTimeout(function () {
          focusToolbarElement($popup_button);
          $popup.data('popup-button', null);
        }, 0);
      }
    }
    /*
     * Focus the button from which the modal was showed.
     */


    function focusModalButton($modal) {
      var $modal_button = $modal.data('modal-button');

      if ($modal_button) {
        setTimeout(function () {
          focusToolbarElement($modal_button);
          $modal.data('modal-button', null);
        }, 0);
      }
    }

    function hasFocus() {
      return editor.shared.$f_el !== null;
    }

    function _clearPopupButton(inst) {
      var $visible_popup = editor.popups.areVisible(inst);

      if ($visible_popup) {
        $visible_popup.data('popup-button', null);
      }
    }

    function _editorKeydownHandler(e) {
      var ctrlKey = navigator.userAgent.indexOf('Mac OS X') !== -1 ? e.metaKey : e.ctrlKey;
      var keycode = e.which; // Alt + F10.

      if (keycode === FroalaEditor.KEYCODE.F10 && !ctrlKey && !e.shiftKey && e.altKey) {
        // Keyboard used.
        editor.shared.with_kb = true; // Focus active popup content inside the current editor if possible, else focus an available toolbar.

        var $visible_popup = editor.popups.areVisible(editor);
        var focused_content = false;

        if ($visible_popup) {
          focused_content = focusContent($visible_popup.children().not('.fr-buttons'));
        }

        if (!focused_content) {
          focusToolbars();
        }

        editor.shared.with_kb = false;
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      return true;
    }
    /**
     * Initialize.
     */


    function _init() {
      // Key down on the editing area.
      if (editor.$wp) {
        editor.events.on('keydown', _editorKeydownHandler, true);
      } else {
        editor.events.$on(editor.$win, 'keydown', _editorKeydownHandler, true);
      } // Mousedown on the editing area.


      editor.events.on('mousedown', function (e) {
        _clearPopupButton(editor);

        if (editor.shared.$f_el) {
          editor.accessibility.restoreSelection();
          e.stopPropagation();
          editor.events.disableBlur();
          editor.shared.$f_el = null;
        }
      }, true); // Blur on the editing area.

      editor.events.on('blur', function () {
        editor.shared.$f_el = null;

        _clearPopupButton(editor);
      }, true);
    }

    return {
      _init: _init,
      registerPopup: registerPopup,
      registerToolbar: registerToolbar,
      focusToolbarElement: focusToolbarElement,
      focusToolbar: focusToolbar,
      focusContent: focusContent,
      focusPopup: focusPopup,
      focusModal: focusModal,
      focusEditor: focusEditor,
      focusPopupButton: focusPopupButton,
      focusModalButton: focusModalButton,
      hasFocus: hasFocus,
      exec: exec,
      saveSelection: saveSelection,
      restoreSelection: restoreSelection
    };
  };

  Object.assign(FroalaEditor.DEFAULTS, {
    tooltips: true
  });

  FroalaEditor.MODULES.tooltip = function (editor) {
    var $ = editor.$;

    function hide() {
      if (editor.helpers.isMobile()) {
        return;
      } // Position fixed for: https://github.com/froala/wysiwyg-editor/issues/1247.


      if (editor.$tooltip) {
        editor.$tooltip.removeClass('fr-visible').css('left', '-3000px').css('position', 'fixed');
      }
    }

    function to($el, above) {
      if (editor.helpers.isMobile()) {
        return;
      }

      if (!$el.data('title')) {
        $el.data('title', $el.attr('title'));
      }

      if (!$el.data('title')) {
        return;
      }

      if (!editor.$tooltip) {
        _init();
      }

      $el.removeAttr('title');
      editor.$tooltip.text(editor.language.translate($el.data('title')));
      editor.$tooltip.addClass('fr-visible');
      var left = $el.offset().left + ($el.outerWidth() - editor.$tooltip.outerWidth()) / 2; // Normalize screen position.

      if (left < 0) {
        left = 0;
      }

      if (left + editor.$tooltip.outerWidth() > $(editor.o_win).width()) {
        left = $(editor.o_win).width() - editor.$tooltip.outerWidth();
      }

      if (typeof above === 'undefined') {
        above = editor.opts.toolbarBottom;
      }

      if ($el.offset().top - $(window).scrollTop() + $el.outerHeight() + 10 >= $(window).height()) {
        above = true;
      }

      var top = !above ? $el.offset().top + $el.outerHeight() : $el.offset().top - editor.$tooltip.height();
      editor.$tooltip.css('position', '');
      editor.$tooltip.css('left', left);
      editor.$tooltip.css('top', Math.ceil(top));

      if ($(editor.o_doc).find('body').first().css('position') !== 'static') {
        editor.$tooltip.css('margin-left', -$(editor.o_doc).find('body').first().offset().left);
        editor.$tooltip.css('margin-top', -$(editor.o_doc).find('body').first().offset().top);
      } else {
        editor.$tooltip.css('margin-left', '');
        editor.$tooltip.css('margin-top', '');
      }
    }

    function bind($el, selector, above) {
      if (editor.opts.tooltips && !editor.helpers.isMobile()) {
        editor.events.$on($el, 'mouseover', selector, function (e) {
          if (!editor.node.hasClass(e.currentTarget, 'fr-disabled') && !editor.edit.isDisabled()) {
            to($(e.currentTarget), above);
          }
        }, true);
        editor.events.$on($el, "mouseout ".concat(editor._mousedown, " ").concat(editor._mouseup), selector, function () {
          hide();
        }, true);
      }
    }

    function _init() {
      if (editor.opts.tooltips && !editor.helpers.isMobile()) {
        if (!editor.shared.$tooltip) {
          editor.shared.$tooltip = $(editor.doc.createElement('DIV')).addClass('fr-tooltip');
          editor.$tooltip = editor.shared.$tooltip;

          if (editor.opts.theme) {
            editor.$tooltip.addClass("".concat(editor.opts.theme, "-theme"));
          }

          $(editor.o_doc).find('body').first().append(editor.$tooltip);
        } else {
          editor.$tooltip = editor.shared.$tooltip;
        }

        editor.events.on('shared.destroy', function () {
          editor.$tooltip.html('').removeData().remove();
          editor.$tooltip = null;
        }, true);
      }
    }

    return {
      hide: hide,
      to: to,
      bind: bind
    };
  };

  FroalaEditor.TOOLBAR_VISIBLE_BUTTONS = 3;

  FroalaEditor.MODULES.button = function (editor) {
    var $ = editor.$;
    var buttons = [];

    if (editor.opts.toolbarInline || editor.opts.toolbarContainer) {
      if (!editor.shared.buttons) {
        editor.shared.buttons = [];
      }

      buttons = editor.shared.buttons;
    }

    var popup_buttons = [];

    if (!editor.shared.popup_buttons) {
      editor.shared.popup_buttons = [];
    }

    popup_buttons = editor.shared.popup_buttons;
    /**
     * Add a new button to the buttons list
     */

    function addButtons($btns) {
      for (var i = 0; i < $btns.length; i++) {
        buttons.push($btns);
      }
    }
    /*
     * Filter buttons based on a specified selector.
     */


    function _filterButtons(butons_list, selector, search_dropdowns) {
      var $filtered_buttons = $();

      for (var i = 0; i < butons_list.length; i++) {
        var $button = $(butons_list[i]);

        if ($button.is(selector)) {
          $filtered_buttons = $filtered_buttons.add($button);
        } // Search for dropdowns menuitems


        if (search_dropdowns && $button.is('.fr-dropdown')) {
          var $dropdown_menu_items = $button.next().find(selector);
          $filtered_buttons = $filtered_buttons.add($dropdown_menu_items);
        }
      }

      return $filtered_buttons;
    }
    /*
     * Get all buttons from page based on a specified selector.
     */


    function getButtons(selector, search_dropdowns) {
      var $buttons = $();
      var id;

      if (!selector) {
        return $buttons;
      } // Search all toolbar buttons.


      $buttons = $buttons.add(_filterButtons(buttons, selector, search_dropdowns)); // Search all popups buttons.

      $buttons = $buttons.add(_filterButtons(popup_buttons, selector, search_dropdowns)); // Look in popup's content.

      for (id in editor.shared.popups) {
        if (Object.prototype.hasOwnProperty.call(editor.shared.popups, id)) {
          var $popup = editor.shared.popups[id];
          var $popup_buttons = $popup.children().find(selector);
          $buttons = $buttons.add($popup_buttons);
        }
      } // Look in modal's content.


      for (id in editor.shared.modals) {
        if (Object.prototype.hasOwnProperty.call(editor.shared.modals, id)) {
          var $modal_hash = editor.shared.modals[id];
          var $modal_buttons = $modal_hash.$modal.find(selector);
          $buttons = $buttons.add($modal_buttons);
        }
      }

      return $buttons;
    }
    /*
    To get popup position with respect to element
    */


    function getPosition($elm) {
      var left = $elm.offset().left;
      var toolbarBottomOffset = 10;
      var topOffset = editor.opts.toolbarBottom ? toolbarBottomOffset : $elm.outerHeight() - toolbarBottomOffset;
      var top = $elm.offset().top + topOffset;
      return {
        left: left,
        top: top
      };
    }
    /**
     * Expands the dropdown
     */


    function _expandDropdown($dropdownWrapper, height, maxHeight) {
      // Show scroll only when height of the dropdown is more than max height
      if (height >= maxHeight) {
        $dropdownWrapper.parent().css('overflow', 'auto');
      } // Height of the dropdown is minimum of its content height and dropdown max height


      $dropdownWrapper.css('height', Math.min(height, maxHeight));
    }
    /**
     * Click was made on a dropdown button.
     */


    function _dropdownButtonClick($btn) {
      var $dropdown = $btn.next();
      var active = editor.node.hasClass($btn.get(0), 'fr-active');
      var $active_dropdowns = getButtons('.fr-dropdown.fr-active').not($btn);
      var inst = $btn.parents('.fr-toolbar, .fr-popup').data('instance') || editor; // Hide keyboard. We need the entire space.

      if (inst.helpers.isIOS() && !inst.el.querySelector('.fr-marker')) {
        inst.selection.save();
        inst.selection.clear();
        inst.selection.restore();
      }

      $dropdown.parents('.fr-more-toolbar').addClass('fr-overflow-visible');
      var ht = 0;
      var dropdownMaxHeight = 0;
      var $dropdownWrapper = $dropdown.find('> .fr-dropdown-wrapper'); // Dropdown is not active.

      if (!active) {
        // Call refresh on show.
        var cmd = $btn.data('cmd');
        $dropdown.find('.fr-command').removeClass('fr-active').attr('aria-selected', false);

        if (FroalaEditor.COMMANDS[cmd] && FroalaEditor.COMMANDS[cmd].refreshOnShow) {
          FroalaEditor.COMMANDS[cmd].refreshOnShow.apply(inst, [$btn, $dropdown]);
        }

        $dropdown.css('left', $btn.offset().left - $btn.parents('.fr-btn-wrap, .fr-toolbar, .fr-buttons').offset().left - (editor.opts.direction === 'rtl' ? $dropdown.width() - $btn.outerWidth() : 0)); // Test height.

        $dropdown.addClass('test-height');
        ht = $dropdown.outerHeight();
        dropdownMaxHeight = editor.helpers.getPX($dropdownWrapper.css('max-height'));
        $dropdown.removeClass('test-height'); // Reset top and bottom.

        $dropdown.css('top', '').css('bottom', ''); // Just to overlap the button with the dropdown by a bit

        var dropdownOffsetTop = $btn.outerHeight() / 10; // Toolbar top or dropdown is exceeding the window.

        if (!editor.opts.toolbarBottom && $dropdown.offset().top + $btn.outerHeight() + ht < $(editor.o_doc).height()) {
          $dropdown.css('top', $btn.position().top + $btn.outerHeight() - dropdownOffsetTop);
        } else {
          var moreToolbarHeight = 0;
          var $moreToolbar = $btn.parents('.fr-more-toolbar');

          if ($moreToolbar.length > 0) {
            moreToolbarHeight = $moreToolbar.first().height();
          }

          $dropdown.css('bottom', $btn.parents('.fr-popup, .fr-toolbar').first().height() - moreToolbarHeight - $btn.position().top);
        }
      } // Blink and activate.


      $btn.addClass('fr-blink').toggleClass('fr-active');

      if ($btn.hasClass('fr-options')) {
        var $prevBtn = $btn.prev();
        $prevBtn.toggleClass('fr-expanded');
      }

      if ($btn.hasClass('fr-active')) {
        $dropdown.attr('aria-hidden', false);
        $btn.attr('aria-expanded', true); // Expand the dropdown

        _expandDropdown($dropdownWrapper, ht, dropdownMaxHeight);
      } else {
        $dropdown.attr('aria-hidden', true).css('overflow', '');
        $btn.attr('aria-expanded', false); // Close active dropdowns

        $dropdownWrapper.css('height', '');
      }

      setTimeout(function () {
        $btn.removeClass('fr-blink');
      }, 300); // Reset left margin for dropdown.

      $dropdown.css('margin-left', ''); // Check if it exceeds window on the right.

      if ($dropdown.offset().left + $dropdown.outerWidth() > editor.$sc.offset().left + editor.$sc.width()) {
        $dropdown.css('margin-left', -($dropdown.offset().left + $dropdown.outerWidth() - editor.$sc.offset().left - editor.$sc.width()));
      } // Check if it exceeds window on the left.


      if ($dropdown.offset().left < editor.$sc.offset().left && editor.opts.direction === 'rtl') {
        $dropdown.css('margin-left', editor.$sc.offset().left);
      } // Hide dropdowns that might be active.
      // Close active dropdowns


      $active_dropdowns.removeClass('fr-active').attr('aria-expanded', false).next().attr('aria-hidden', true).css('overflow', '').find('> .fr-dropdown-wrapper').css('height', '');
      $active_dropdowns.prev('.fr-expanded').removeClass('fr-expanded');
      $active_dropdowns.parents('.fr-toolbar:not(.fr-inline)').css('zIndex', '');

      if ($btn.parents('.fr-popup').length === 0 && !editor.opts.toolbarInline) {
        if (editor.node.hasClass($btn.get(0), 'fr-active')) {
          editor.$tb.css('zIndex', (editor.opts.zIndex || 1) + 4);
        } else {
          editor.$tb.css('zIndex', '');
        }
      } // Focus the active element or the dropdown button to enable accessibility.


      var $active_element = $dropdown.find('a.fr-command.fr-active').first(); // We do not need to focus on mobile.

      if (!editor.helpers.isMobile()) {
        if ($active_element.length) {
          editor.accessibility.focusToolbarElement($active_element); // Scroll the selected element to the middle

          $dropdownWrapper.scrollTop(Math.abs($active_element.parents('.fr-dropdown-content').offset().top - $active_element.offset().top) - $active_element.offset().top);
        } else {
          editor.accessibility.focusToolbarElement($btn);
          $dropdownWrapper.scrollTop(0);
        }
      }
    }

    function exec($btn) {
      // Blink.
      $btn.addClass('fr-blink');
      setTimeout(function () {
        $btn.removeClass('fr-blink');
      }, 500); // Get command, value and additional params.

      var cmd = $btn.data('cmd');
      var params = [];

      while (typeof $btn.data("param".concat(params.length + 1)) !== 'undefined') {
        params.push($btn.data("param".concat(params.length + 1)));
      } // Hide dropdowns that might be active including the current one.


      var $active_dropdowns = getButtons('.fr-dropdown.fr-active');

      if ($active_dropdowns.length) {
        $active_dropdowns.removeClass('fr-active').attr('aria-expanded', false).next().attr('aria-hidden', true).css('overflow', '').find('> .fr-dropdown-wrapper').css('height', '');
        $active_dropdowns.prev('.fr-expanded').removeClass('fr-expanded');
        $active_dropdowns.parents('.fr-toolbar:not(.fr-inline)').css('zIndex', '');
      } // Call the command.


      $btn.parents('.fr-popup, .fr-toolbar').data('instance').commands.exec(cmd, params);
    }
    /**
     * Click was made on a command button.
     */


    function _commandButtonClick($btn) {
      exec($btn);
    }

    function click($btn) {
      // Get current editor instance
      var inst = $btn.parents('.fr-popup, .fr-toolbar').data('instance'); // Active popup button only if it is not active

      if ($btn.parents('.fr-popup').length === 0 && $btn.data('popup') && !$btn.hasClass('fr-btn-active-popup')) {
        $btn.addClass('fr-btn-active-popup');
      }

      if ($btn.parents('.fr-popup').length === 0 && !$btn.data('popup')) {
        inst.popups.hideAll();
      } // Popups are visible, but not in the current instance.


      if (inst.popups.areVisible() && !inst.popups.areVisible(inst)) {
        // Hide markers in other instances.
        for (var i = 0; i < FroalaEditor.INSTANCES.length; i++) {
          if (FroalaEditor.INSTANCES[i] !== inst && FroalaEditor.INSTANCES[i].popups && FroalaEditor.INSTANCES[i].popups.areVisible()) {
            FroalaEditor.INSTANCES[i].$el.find('.fr-marker').remove();
          }
        }

        inst.popups.hideAll();
      } // Dropdown button.


      if (editor.node.hasClass($btn.get(0), 'fr-dropdown')) {
        _dropdownButtonClick($btn);
      } // Regular button.
      else {
          _commandButtonClick($btn);

          if (FroalaEditor.COMMANDS[$btn.data('cmd')] && FroalaEditor.COMMANDS[$btn.data('cmd')].refreshAfterCallback !== false) {
            inst.button.bulkRefresh();
          }
        }
    }

    function _click(e) {
      var $btn = $(e.currentTarget);
      click($btn);
    }

    function hideActiveDropdowns($el) {
      var $active_dropdowns = $el.find('.fr-dropdown.fr-active');

      if ($active_dropdowns.length) {
        $active_dropdowns.removeClass('fr-active').attr('aria-expanded', false).next().attr('aria-hidden', true).css('overflow', '').find('> .fr-dropdown-wrapper').css('height', '');
        $active_dropdowns.parents('.fr-toolbar:not(.fr-inline)').css('zIndex', '');
        $active_dropdowns.prev().removeClass('fr-expanded');
      }
    }
    /**
     * Click in the dropdown menu.
     */


    function _dropdownMenuClick(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    /**
     * Click on the dropdown wrapper.
     */


    function _dropdownWrapperClick(e) {
      e.stopPropagation(); // Prevent blurring.

      if (!editor.helpers.isMobile()) {
        return false;
      }
    }
    /**
     * Bind callbacks for commands.
     */


    function bindCommands($el, tooltipAbove) {
      editor.events.bindClick($el, '.fr-command:not(.fr-disabled)', _click); // Click on the dropdown menu.

      editor.events.$on($el, "".concat(editor._mousedown, " ").concat(editor._mouseup, " ").concat(editor._move), '.fr-dropdown-menu', _dropdownMenuClick, true); // Click on the dropdown wrapper.

      editor.events.$on($el, "".concat(editor._mousedown, " ").concat(editor._mouseup, " ").concat(editor._move), '.fr-dropdown-menu .fr-dropdown-wrapper', _dropdownWrapperClick, true); // Hide dropdowns that might be active.

      var _document = $el.get(0).ownerDocument;

      var _window = 'defaultView' in _document ? _document.defaultView : _document.parentWindow;

      function hideDropdowns(e) {
        if (!e || e.type === editor._mouseup && e.target !== $('html').get(0) || e.type === 'keydown' && (editor.keys.isCharacter(e.which) && !editor.keys.ctrlKey(e) || e.which === FroalaEditor.KEYCODE.ESC)) {
          hideActiveDropdowns($el);
        }
      }

      editor.events.$on($(_window), "".concat(editor._mouseup, " resize keydown"), hideDropdowns, true);

      if (editor.opts.iframe) {
        editor.events.$on(editor.$win, editor._mouseup, hideDropdowns, true);
      } // Add refresh.


      if (editor.node.hasClass($el.get(0), 'fr-popup')) {
        $.merge(popup_buttons, $el.find('.fr-btn').toArray());
      } else {
        $.merge(buttons, $el.find('.fr-btn').toArray());
      } // Assing tooltips to buttons.


      editor.tooltip.bind($el, '.fr-btn, .fr-title', tooltipAbove);
    }
    /**
     * Create the content for dropdown.
     */


    function _content(command, info) {
      var c = '';

      if (info.html) {
        if (typeof info.html === 'function') {
          c += info.html.call(editor);
        } else {
          c += info.html;
        }
      } else {
        var options = info.options;

        if (typeof options === 'function') {
          options = options();
        }

        c += '<ul class="fr-dropdown-list" role="presentation">';

        for (var val in options) {
          if (Object.prototype.hasOwnProperty.call(options, val)) {
            var shortcut = editor.shortcuts.get("".concat(command, ".").concat(val));

            if (shortcut) {
              shortcut = "<span class=\"fr-shortcut\">".concat(shortcut, "</span>");
            } else {
              shortcut = '';
            }

            c += "<li role=\"presentation\"><a class=\"fr-command\" tabIndex=\"-1\" role=\"option\" data-cmd=\"".concat(info.type === 'options' ? command.replace(/Options/g, '') : command, "\" data-param1=\"").concat(val, "\" title=\"").concat(options[val], "\">").concat(editor.language.translate(options[val]), "</a></li>");
          }
        }

        c += '</ul>';
      }

      return c;
    }
    /**
     * Create button.
     */


    function build(command) {
      var info = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var visible = arguments.length > 2 ? arguments[2] : undefined;

      if (editor.helpers.isMobile() && info.showOnMobile === false) {
        return '';
      }

      var display_selection = info.displaySelection;

      if (typeof display_selection === 'function') {
        display_selection = display_selection(editor);
      }

      var icon = '';

      if (info.type !== 'options') {
        if (display_selection) {
          var default_selection = typeof info.defaultSelection === 'function' ? info.defaultSelection(editor) : info.defaultSelection;
          icon = "<span style=\"width:".concat(info.displaySelectionWidth || 100, "px\">").concat(editor.language.translate(default_selection || info.title), "</span>");
        } else {
          icon = editor.icon.create(info.icon || command); // Used instead of aria-label. The advantage is that it also display text when the css is disabled.

          icon += "<span class=\"fr-sr-only\">".concat(editor.language.translate(info.title) || '', "</span>");
        }
      }

      var popup = info.popup ? ' data-popup="true"' : '';
      var modal = info.modal ? ' data-modal="true"' : '';
      var shortcut = editor.shortcuts.get("".concat(command, "."));

      if (shortcut) {
        shortcut = " (".concat(shortcut, ")");
      } else {
        shortcut = '';
      } // Add custom id if present


      var button_id = "".concat(command, "-").concat(editor.id);
      var dropdown_id = "dropdown-menu-".concat(button_id);
      var btn = "<button id=\"".concat(button_id, "\"").concat(info.more_btn ? " data-group-name=\"".concat(button_id, "\" ") : '', "type=\"button\" tabIndex=\"-1\" role=\"button\"").concat(info.toggle ? ' aria-pressed="false"' : '').concat(info.type === 'dropdown' || info.type === 'options' ? " aria-controls=\"".concat(dropdown_id, "\" aria-expanded=\"false\" aria-haspopup=\"true\"") : '').concat(info.disabled ? ' aria-disabled="true"' : '', " title=\"").concat(editor.language.translate(info.title) || '').concat(shortcut, "\" class=\"fr-command fr-btn").concat(info.type === 'dropdown' || info.type == 'options' ? ' fr-dropdown' : '').concat(info.type == 'options' ? ' fr-options' : '').concat(info.type == 'more' ? ' fr-more' : '').concat(info.displaySelection ? ' fr-selection' : '').concat(info.back ? ' fr-back' : '').concat(info.disabled ? ' fr-disabled' : '').concat(!visible ? ' fr-hidden' : '', "\" data-cmd=\"").concat(command, "\"").concat(popup).concat(modal, ">").concat(icon, "</button>");

      if (info.type === 'dropdown' || info.type === 'options') {
        // Build dropdown.
        var dropdown = "<div id=\"".concat(dropdown_id, "\" class=\"fr-dropdown-menu\" role=\"listbox\" aria-labelledby=\"").concat(button_id, "\" aria-hidden=\"true\"><div class=\"fr-dropdown-wrapper\" role=\"presentation\"><div class=\"fr-dropdown-content\" role=\"presentation\">");
        dropdown += _content(command, info);
        dropdown += '</div></div></div>';
        btn += dropdown;
      }

      if (info.hasOptions && info.hasOptions.apply(editor)) {
        btn = "<div class=\"fr-btn-wrap\">".concat(btn, " ").concat(build(command + 'Options', Object.assign({}, info, {
          type: 'options',
          hasOptions: false
        }), visible), "  </div>");
      }

      return btn;
    }

    function buildList(buttons, visible_buttons) {
      var str = '';

      for (var i = 0; i < buttons.length; i++) {
        var cmd_name = buttons[i];
        var cmd_info = FroalaEditor.COMMANDS[cmd_name];

        if (cmd_info && typeof cmd_info.plugin !== 'undefined' && editor.opts.pluginsEnabled.indexOf(cmd_info.plugin) < 0) {
          continue;
        }

        if (cmd_info) {
          var visible = typeof visible_buttons !== 'undefined' ? visible_buttons.indexOf(cmd_name) >= 0 : true;
          str += build(cmd_name, cmd_info, visible);
        } else if (cmd_name === '|') {
          str += '<div class="fr-separator fr-vs" role="separator" aria-orientation="vertical"></div>';
        } else if (cmd_name === '-') {
          str += '<div class="fr-separator fr-hs" role="separator" aria-orientation="horizontal"></div>';
        }
      }

      return str;
    }
    /**
     * Build button groups html
     */


    function buildGroup(buttonGroups) {
      // Toolbar Groups HTML
      var mainToolbarGroupsHTML = '';
      var moreToolbarGroupsHTML = '';

      for (var groupName in buttonGroups) {
        var buttonGroup = buttonGroups[groupName]; // Ignore non-button groups

        if (!buttonGroup.buttons) {
          continue;
        } // Current button group Details


        var mainToolbarButtonsHTML = '';
        var moreToolbarButtonsHTML = '';
        var buttonCount = 0;
        var alignment = 'left';
        var visibleButtons = FroalaEditor.TOOLBAR_VISIBLE_BUTTONS;

        for (var i = 0; i < buttonGroup.buttons.length; i++) {
          // Get command name
          var cmdName = buttonGroup.buttons[i]; // Get command details

          var cmdInfo = FroalaEditor.COMMANDS[cmdName];

          if (!cmdInfo) {
            if (cmdName == '|') {
              mainToolbarButtonsHTML += '<div class="fr-separator fr-vs" role="separator" aria-orientation="vertical"></div>';
            } else if (cmdName == '-') {
              mainToolbarButtonsHTML += '<div class="fr-separator fr-hs" role="separator" aria-orientation="horizontal"></div>';
            }
          }

          if (!cmdInfo || cmdInfo && typeof cmdInfo.plugin !== 'undefined' && editor.opts.pluginsEnabled.indexOf(cmdInfo.plugin) < 0) {
            continue;
          } // If alignment of group is provided then use it


          if (buttonGroups[groupName].align !== undefined) {
            alignment = buttonGroups[groupName].align;
          } // If buttonsVisible is provided then use it


          if (buttonGroups[groupName].buttonsVisible !== undefined) {
            visibleButtons = buttonGroups[groupName].buttonsVisible;
          } // Build button groups from command details


          if (buttonGroups.showMoreButtons && buttonCount >= visibleButtons) {
            moreToolbarButtonsHTML += build(cmdName, cmdInfo, true);
          } else {
            mainToolbarButtonsHTML += build(cmdName, cmdInfo, true);
          }

          buttonCount++;
        } // If atleast one hidden group exists then add its corresponding more button


        if (buttonGroups.showMoreButtons && buttonCount > visibleButtons) {
          var _cmdName = groupName;
          var _cmdInfo = FroalaEditor.COMMANDS[_cmdName];
          _cmdInfo.more_btn = true;
          mainToolbarButtonsHTML += build(_cmdName, _cmdInfo, true);
        } // Add toolbar buttons html to the groups html


        mainToolbarGroupsHTML += "<div class=\"fr-btn-grp fr-float-".concat(alignment, "\">").concat(mainToolbarButtonsHTML, "</div>");

        if (buttonGroups.showMoreButtons && moreToolbarButtonsHTML.length > 0) {
          moreToolbarGroupsHTML += "<div class=\"fr-more-toolbar\" data-name=\"".concat(groupName + '-' + editor.id, "\">").concat(moreToolbarButtonsHTML, "</div>");
        }
      } // Return toolbar button groups html


      if (editor.opts.toolbarBottom) {
        return "".concat(moreToolbarGroupsHTML, "<div class=\"fr-newline\"></div>").concat(mainToolbarGroupsHTML);
      }

      return "".concat(mainToolbarGroupsHTML, "<div class=\"fr-newline\"></div>").concat(moreToolbarGroupsHTML);
    }

    function refresh($btn) {
      var inst = $btn.parents('.fr-popup, .fr-toolbar').data('instance') || editor;
      var cmd = $btn.data('cmd');
      var $dropdown;

      if (!editor.node.hasClass($btn.get(0), 'fr-dropdown')) {
        $btn.removeClass('fr-active');

        if ($btn.attr('aria-pressed')) {
          $btn.attr('aria-pressed', false);
        }
      } else {
        $dropdown = $btn.next();
      }

      if (FroalaEditor.COMMANDS[cmd] && FroalaEditor.COMMANDS[cmd].refresh) {
        FroalaEditor.COMMANDS[cmd].refresh.apply(inst, [$btn, $dropdown]);
      } else if (editor.refresh[cmd]) {
        inst.refresh[cmd]($btn, $dropdown);
      }
    }

    function _bulkRefresh(btns) {
      var inst = editor.$tb ? editor.$tb.data('instance') || editor : editor; // Check the refresh event.

      if (editor.events.trigger('buttons.refresh') === false) {
        return true;
      }

      setTimeout(function () {
        var focused = inst.selection.inEditor() && inst.core.hasFocus();

        for (var i = 0; i < btns.length; i++) {
          var $btn = $(btns[i]);
          var cmd = $btn.data('cmd');

          if ($btn.parents('.fr-popup').length === 0) {
            if (focused || FroalaEditor.COMMANDS[cmd] && FroalaEditor.COMMANDS[cmd].forcedRefresh) {
              inst.button.refresh($btn);
            } else if (!editor.node.hasClass($btn.get(0), 'fr-dropdown')) {
              $btn.removeClass('fr-active');

              if ($btn.attr('aria-pressed')) {
                $btn.attr('aria-pressed', false);
              }
            }
          } else if ($btn.parents('.fr-popup').isVisible()) {
            inst.button.refresh($btn);
          }
        }
      }, 0);
    }
    /**
     * Do buttons refresh.
     */


    function bulkRefresh() {
      _bulkRefresh(buttons);

      _bulkRefresh(popup_buttons);
    }

    function _destroy() {
      buttons = [];
      popup_buttons = [];
    }

    var refresh_timeout = null;

    function delayedBulkRefresh() {
      clearTimeout(refresh_timeout);
      refresh_timeout = setTimeout(bulkRefresh, 50);
    }
    /**
     * Initialize.
     */


    function _init() {
      // Assign refresh and do refresh.
      if (editor.opts.toolbarInline) {
        editor.events.on('toolbar.show', bulkRefresh);
      } else {
        editor.events.on('mouseup', delayedBulkRefresh);
        editor.events.on('keyup', delayedBulkRefresh);
        editor.events.on('blur', delayedBulkRefresh);
        editor.events.on('focus', delayedBulkRefresh);
        editor.events.on('contentChanged', delayedBulkRefresh);

        if (editor.helpers.isMobile()) {
          editor.events.$on(editor.$doc, 'selectionchange', bulkRefresh);
        }
      }

      editor.events.on('shared.destroy', _destroy);
    }

    return {
      _init: _init,
      build: build,
      buildList: buildList,
      buildGroup: buildGroup,
      bindCommands: bindCommands,
      refresh: refresh,
      bulkRefresh: bulkRefresh,
      exec: exec,
      click: click,
      hideActiveDropdowns: hideActiveDropdowns,
      addButtons: addButtons,
      getButtons: getButtons,
      getPosition: getPosition
    };
  };

  FroalaEditor.ICON_TEMPLATES = {
    font_awesome: '<i class="fa fa-[NAME]" aria-hidden="true"></i>',
    font_awesome_5: '<i class="fas fa-[FA5NAME]" aria-hidden="true"></i>',
    font_awesome_5r: '<i class="far fa-[FA5NAME]" aria-hidden="true"></i>',
    font_awesome_5l: '<i class="fal fa-[FA5NAME]" aria-hidden="true"></i>',
    font_awesome_5b: '<i class="fab fa-[FA5NAME]" aria-hidden="true"></i>',
    text: '<span style="text-align: center;">[NAME]</span>',
    image: '<img src=[SRC] alt=[ALT] />',
    svg: '<svg class="fr-svg" focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="[PATH]"/></svg>',
    empty: ' '
  };
  FroalaEditor.ICONS = {
    bold: {
      NAME: 'bold',
      SVG_KEY: 'bold'
    },
    italic: {
      NAME: 'italic',
      SVG_KEY: 'italic'
    },
    underline: {
      NAME: 'underline',
      SVG_KEY: 'underline'
    },
    strikeThrough: {
      NAME: 'strikethrough',
      SVG_KEY: 'strikeThrough'
    },
    subscript: {
      NAME: 'subscript',
      SVG_KEY: 'subscript'
    },
    superscript: {
      NAME: 'superscript',
      SVG_KEY: 'superscript'
    },
    color: {
      NAME: 'tint',
      SVG_KEY: 'textColor'
    },
    outdent: {
      NAME: 'outdent',
      SVG_KEY: 'outdent'
    },
    indent: {
      NAME: 'indent',
      SVG_KEY: 'indent'
    },
    undo: {
      NAME: 'rotate-left',
      FA5NAME: 'undo',
      SVG_KEY: 'undo'
    },
    redo: {
      NAME: 'rotate-right',
      FA5NAME: 'redo',
      SVG_KEY: 'redo'
    },
    insertHR: {
      NAME: 'minus',
      SVG_KEY: 'horizontalLine'
    },
    clearFormatting: {
      NAME: 'eraser',
      SVG_KEY: 'clearFormatting'
    },
    selectAll: {
      NAME: 'mouse-pointer',
      SVG_KEY: 'selectAll'
    },
    moreText: {
      NAME: 'ellipsis-v',
      SVG_KEY: 'textMore'
    },
    moreParagraph: {
      NAME: 'ellipsis-v',
      SVG_KEY: 'paragraphMore'
    },
    moreRich: {
      NAME: 'ellipsis-v',
      SVG_KEY: 'insertMore'
    },
    moreMisc: {
      NAME: 'ellipsis-v',
      SVG_KEY: 'more'
    }
  };

  FroalaEditor.DefineIconTemplate = function (name, options) {
    FroalaEditor.ICON_TEMPLATES[name] = options;
  };

  FroalaEditor.DefineIcon = function (name, options) {
    FroalaEditor.ICONS[name] = options;
  };

  Object.assign(FroalaEditor.DEFAULTS, {
    iconsTemplate: 'svg'
  });

  FroalaEditor.MODULES.icon = function (editor) {
    function create(command) {
      var icon = null;
      var info = FroalaEditor.ICONS[command];

      if (typeof info !== 'undefined') {
        var template = info.template || FroalaEditor.ICON_DEFAULT_TEMPLATE || editor.opts.iconsTemplate;

        if (template && template.apply) {
          template = template.apply(editor);
        }

        if (!info.FA5NAME) {
          info.FA5NAME = info.NAME;
        }

        if (template === 'svg' && !info.PATH) {
          // https://github.com/froala-labs/froala-editor-js-2/issues/1812
          // if user doesn't specify `SVG_KEY`, pass it as string
          info.PATH = FroalaEditor.SVG[info.SVG_KEY] || '';
        }

        if (template && (template = FroalaEditor.ICON_TEMPLATES[template])) {
          icon = template.replace(/\[([a-zA-Z0-9]*)\]/g, function (str, a1) {
            if (a1 === 'NAME') {
              return info[a1] || command;
            }

            return info[a1];
          });
        }
      }

      return icon || command;
    }

    function getTemplate(command) {
      var info = FroalaEditor.ICONS[command];
      var template = editor.opts.iconsTemplate;

      if (typeof info !== 'undefined') {
        template = info.template || FroalaEditor.ICON_DEFAULT_TEMPLATE || editor.opts.iconsTemplate;
        return template;
      }

      return template;
    }

    return {
      create: create,
      getTemplate: getTemplate
    };
  };

  FroalaEditor.SVG = {
    add: 'M19,13h-6v6h-2v-6H5v-2h6V5h2v6h6V13z',
    advancedImageEditor: 'M3,17v2h6v-2H3z M3,5v2h10V5H3z M13,21v-2h8v-2h-8v-2h-2v6H13z M7,9v2H3v2h4v2h2V9H7z M21,13v-2H11v2H21z M15,9h2V7h4V5h-4  V3h-2V9z',
    alignCenter: 'M9,18h6v-2H9V18z M6,11v2h12v-2H6z M3,6v2h18V6H3z',
    alignJustify: 'M3,18h18v-2H3V18z M3,11v2h18v-2H3z M3,6v2h18V6H3z',
    alignLeft: 'M3,18h6v-2H3V18z M3,11v2h12v-2H3z M3,6v2h18V6H3z',
    alignRight: 'M15,18h6v-2h-6V18z M9,11v2h12v-2H9z M3,6v2h18V6H3z',
    anchors: 'M16,4h-4H8C6.9,4,6,4.9,6,6v4v10l6-2.6l6,2.6V10V6C18,4.9,17.1,4,16,4z M16,17l-4-1.8L8,17v-7V6h4h4v4V17z',
    back: 'M20 11L7.83 11 11.425 7.405 10.01 5.991 5.416 10.586 5.414 10.584 4 11.998 4.002 12 4 12.002 5.414 13.416 5.416 13.414 10.01 18.009 11.425 16.595 7.83 13 20 13 20 13 20 11 20 11Z',
    backgroundColor: 'M9.91752,12.24082l7.74791-5.39017,1.17942,1.29591-6.094,7.20747L9.91752,12.24082M7.58741,12.652l4.53533,4.98327a.93412.93412,0,0,0,1.39531-.0909L20.96943,8.7314A.90827.90827,0,0,0,20.99075,7.533l-2.513-2.76116a.90827.90827,0,0,0-1.19509-.09132L7.809,11.27135A.93412.93412,0,0,0,7.58741,12.652ZM2.7939,18.52772,8.41126,19.5l1.47913-1.34617-3.02889-3.328Z',
    blockquote: 'M10.31788,5l.93817,1.3226A12.88271,12.88271,0,0,0,8.1653,9.40125a5.54242,5.54242,0,0,0-.998,3.07866v.33733q.36089-.04773.66067-.084a4.75723,4.75723,0,0,1,.56519-.03691,2.87044,2.87044,0,0,1,2.11693.8427,2.8416,2.8416,0,0,1,.8427,2.09274,3.37183,3.37183,0,0,1-.8898,2.453A3.143,3.143,0,0,1,8.10547,19,3.40532,3.40532,0,0,1,5.375,17.7245,4.91156,4.91156,0,0,1,4.30442,14.453,9.3672,9.3672,0,0,1,5.82051,9.32933,14.75716,14.75716,0,0,1,10.31788,5Zm8.39243,0,.9369,1.3226a12.88289,12.88289,0,0,0-3.09075,3.07865,5.54241,5.54241,0,0,0-.998,3.07866v.33733q.33606-.04773.63775-.084a4.91773,4.91773,0,0,1,.58938-.03691,2.8043,2.8043,0,0,1,2.1042.83,2.89952,2.89952,0,0,1,.80578,2.10547,3.42336,3.42336,0,0,1-.86561,2.453A3.06291,3.06291,0,0,1,16.49664,19,3.47924,3.47924,0,0,1,13.742,17.7245,4.846,4.846,0,0,1,12.64721,14.453,9.25867,9.25867,0,0,1,14.17476,9.3898,15.26076,15.26076,0,0,1,18.71031,5Z',
    bold: 'M15.25,11.8h0A3.68,3.68,0,0,0,17,9a3.93,3.93,0,0,0-3.86-4H6.65V19h7a3.74,3.74,0,0,0,3.7-3.78V15.1A3.64,3.64,0,0,0,15.25,11.8ZM8.65,7h4.2a2.09,2.09,0,0,1,2,1.3,2.09,2.09,0,0,1-1.37,2.61,2.23,2.23,0,0,1-.63.09H8.65Zm4.6,10H8.65V13h4.6a2.09,2.09,0,0,1,2,1.3,2.09,2.09,0,0,1-1.37,2.61A2.23,2.23,0,0,1,13.25,17Z',
    cellBackground: 'M16.6,12.4L7.6,3.5L6.2,4.9l2.4,2.4l-5.2,5.2c-0.6,0.6-0.6,1.5,0,2.1l5.5,5.5c0.3,0.3,0.7,0.4,1.1,0.4s0.8-0.1,1.1-0.4  l5.5-5.5C17.2,14,17.2,13,16.6,12.4z M5.2,13.5L10,8.7l4.8,4.8H5.2z M19,15c0,0-2,2.2-2,3.5c0,1.1,0.9,2,2,2s2-0.9,2-2  C21,17.2,19,15,19,15z',
    cellBorderColor: 'M22,22H2v2h20V22z',
    cellOptions: 'M20,5H4C2.9,5,2,5.9,2,7v10c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V7C22,5.9,21.1,5,20,5z M9.5,6.5h5V9h-5V6.5z M8,17.5H4  c-0.3,0-0.5-0.2-0.5-0.4c0,0,0,0,0,0V17v-2H8V17.5z M8,13.5H3.5v-3H8V13.5z M8,9H3.5V7c0-0.3,0.2-0.5,0.4-0.5c0,0,0,0,0,0H8V9z   M14.5,17.5h-5V15h5V17.5z M20.5,17c0,0.3-0.2,0.5-0.4,0.5c0,0,0,0,0,0H16V15h4.5V17z M20.5,13.5H16v-3h4.5V13.5z M20.5,9H16V6.5h4  c0.3,0,0.5,0.2,0.5,0.4c0,0,0,0,0,0V9z',
    cellStyle: 'M20,19.9l0.9,3.6l-3.2-1.9l-3.3,1.9l0.8-3.6L12.3,17h3.8l1.7-3.5l1.4,3.5H23L20,19.9z M20,5H4C2.9,5,2,5.9,2,7v10  c0,1.1,0.9,2,2,2h7.5l-0.6-0.6L10,17.5H9.5V15h5.4l1.1-2.3v-2.2h4.5v3H20l0.6,1.5H22V7C22,5.9,21.1,5,20,5z M3.5,7  c0-0.3,0.2-0.5,0.4-0.5c0,0,0,0,0.1,0h4V9H3.5V7z M3.5,10.5H8v3H3.5V10.5z M4,17.5c-0.3,0-0.5-0.2-0.5-0.4c0,0,0,0,0-0.1v-2H8v2.5H4  z M14.5,9h-5V6.5h5V9z M20.5,9H16V6.5h4c0.3,0,0.5,0.2,0.5,0.4c0,0,0,0,0,0.1V9z',
    clearFormatting: 'M11.48,10.09l-1.2-1.21L8.8,7.41,6.43,5,5.37,6.1,8.25,9,4.66,19h2l1.43-4h5.14l1.43,4h2l-.89-2.51L18.27,19l1.07-1.06L14.59,13.2ZM8.8,13l.92-2.56L12.27,13Zm.56-7.15L9.66,5h2l1.75,4.9Z',
    close: 'M13.4,12l5.6,5.6L17.6,19L12,13.4L6.4,19L5,17.6l5.6-5.6L5,6.4L6.4,5l5.6,5.6L17.6,5L19,6.4L13.4,12z',
    codeView: 'M9.4,16.6,4.8,12,9.4,7.4,8,6,2,12l6,6Zm5.2,0L19.2,12,14.6,7.4,16,6l6,6-6,6Z',
    cogs: 'M18.877 12.907a6.459 6.459 0 0 0 0 -1.814l1.952 -1.526a0.468 0.468 0 0 0 0.111 -0.593l-1.851 -3.2a0.461 0.461 0 0 0 -0.407 -0.231 0.421 0.421 0 0 0 -0.157 0.028l-2.3 0.925a6.755 6.755 0 0 0 -1.563 -0.907l-0.352 -2.452a0.451 0.451 0 0 0 -0.453 -0.388h-3.7a0.451 0.451 0 0 0 -0.454 0.388L9.347 5.588A7.077 7.077 0 0 0 7.783 6.5l-2.3 -0.925a0.508 0.508 0 0 0 -0.166 -0.028 0.457 0.457 0 0 0 -0.4 0.231l-1.851 3.2a0.457 0.457 0 0 0 0.111 0.593l1.952 1.526A7.348 7.348 0 0 0 5.063 12a7.348 7.348 0 0 0 0.064 0.907L3.175 14.433a0.468 0.468 0 0 0 -0.111 0.593l1.851 3.2a0.461 0.461 0 0 0 0.407 0.231 0.421 0.421 0 0 0 0.157 -0.028l2.3 -0.925a6.74 6.74 0 0 0 1.564 0.907L9.7 20.864a0.451 0.451 0 0 0 0.454 0.388h3.7a0.451 0.451 0 0 0 0.453 -0.388l0.352 -2.452a7.093 7.093 0 0 0 1.563 -0.907l2.3 0.925a0.513 0.513 0 0 0 0.167 0.028 0.457 0.457 0 0 0 0.4 -0.231l1.851 -3.2a0.468 0.468 0 0 0 -0.111 -0.593Zm-0.09 2.029l-0.854 1.476 -2.117 -0.852 -0.673 0.508a5.426 5.426 0 0 1 -1.164 0.679l-0.795 0.323 -0.33 2.269h-1.7l-0.32 -2.269 -0.793 -0.322a5.3 5.3 0 0 1 -1.147 -0.662L8.2 15.56l-2.133 0.86 -0.854 -1.475 1.806 -1.411 -0.1 -0.847c-0.028 -0.292 -0.046 -0.5 -0.046 -0.687s0.018 -0.4 0.045 -0.672l0.106 -0.854L5.217 9.064l0.854 -1.475 2.117 0.851 0.673 -0.508a5.426 5.426 0 0 1 1.164 -0.679l0.8 -0.323 0.331 -2.269h1.7l0.321 2.269 0.792 0.322a5.3 5.3 0 0 1 1.148 0.661l0.684 0.526 2.133 -0.859 0.853 1.473 -1.8 1.421 0.1 0.847a5 5 0 0 1 0.046 0.679c0 0.193 -0.018 0.4 -0.045 0.672l-0.106 0.853ZM12 14.544A2.544 2.544 0 1 1 14.546 12 2.552 2.552 0 0 1 12 14.544Z',
    columns: 'M20,5H4C2.9,5,2,5.9,2,7v10c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V7C22,5.9,21.1,5,20,5z M8,17.5H4c-0.3,0-0.5-0.2-0.5-0.4  c0,0,0,0,0,0V17v-2H8V17.5z M8,13.5H3.5v-3H8V13.5z M8,9H3.5V7c0-0.3,0.2-0.5,0.4-0.5c0,0,0,0,0,0H8V9z M20.5,17  c0,0.3-0.2,0.5-0.4,0.5c0,0,0,0,0,0H16V15h4.5V17z M20.5,13.5H16v-3h4.5V13.5z M20.5,9H16V6.5h4c0.3,0,0.5,0.2,0.5,0.4c0,0,0,0,0,0  V9z',
    editLink: 'M17,11.2L12.8,7L5,14.8V19h4.2L17,11.2z M7,16.8v-1.5l5.6-5.6l1.4,1.5l-5.6,5.6H7z M13.5,6.3l0.7-0.7c0.8-0.8,2.1-0.8,2.8,0  c0,0,0,0,0,0L18.4,7c0.8,0.8,0.8,2,0,2.8l-0.7,0.7L13.5,6.3z',
    exitFullscreen: 'M5,16H8v3h2V14H5ZM8,8H5v2h5V5H8Zm6,11h2V16h3V14H14ZM16,8V5H14v5h5V8Z',
    fontAwesome: 'M18.99018,13.98212V7.52679c-.08038-1.21875-1.33929-.683-1.33929-.683-2.933,1.39282-4.36274.61938-5.85938.15625a6.23272,6.23272,0,0,0-2.79376-.20062l-.00946.004A1.98777,1.98777,0,0,0,7.62189,5.106a.984.984,0,0,0-.17517-.05432c-.02447-.0055-.04882-.01032-.0736-.0149A.9565.9565,0,0,0,7.1908,5H6.82539a.9565.9565,0,0,0-.18232.0368c-.02472.00458-.04907.0094-.07348.01484a.985.985,0,0,0-.17523.05438,1.98585,1.98585,0,0,0-.573,3.49585v9.394A1.004,1.004,0,0,0,6.82539,19H7.1908a1.00406,1.00406,0,0,0,1.00409-1.00409V15.52234c3.64221-1.09827,5.19709.64282,7.09888.57587a5.57291,5.57291,0,0,0,3.25446-1.05805A1.2458,1.2458,0,0,0,18.99018,13.98212Z',
    fontFamily: 'M16,19h2L13,5H11L6,19H8l1.43-4h5.14Zm-5.86-6L12,7.8,13.86,13Z',
    fontSize: 'M20.75,19h1.5l-3-10h-1.5l-3,10h1.5L17,16.5h3Zm-3.3-4,1.05-3.5L19.55,15Zm-5.7,4h2l-5-14h-2l-5,14h2l1.43-4h5.14ZM5.89,13,7.75,7.8,9.61,13Z',
    fullscreen: 'M7,14H5v5h5V17H7ZM5,10H7V7h3V5H5Zm12,7H14v2h5V14H17ZM14,5V7h3v3h2V5Z',
    help: 'M11,17h2v2h-2V17z M12,5C9.8,5,8,6.8,8,9h2c0-1.1,0.9-2,2-2s2,0.9,2,2c0,2-3,1.7-3,5v1h2v-1c0-2.2,3-2.5,3-5  C16,6.8,14.2,5,12,5z',
    horizontalLine: 'M5,12h14 M19,11H5v2h14V11z',
    imageAltText: 'M19,7h-6v12h-2V7H5V5h6h2h6V7z',
    imageCaption: 'M14.2,11l3.8,5H6l3-3.9l2.1,2.7L14,11H14.2z M8.5,11c0.8,0,1.5-0.7,1.5-1.5S9.3,8,8.5,8S7,8.7,7,9.5C7,10.3,7.7,11,8.5,11z   M22,6v12c0,1.1-0.9,2-2,2H4c-1.1,0-2-0.9-2-2V6c0-1.1,0.9-2,2-2h16C21.1,4,22,4.9,22,6z M20,8.8V6H4v12h16V8.8z M22,22H2v2h20V22z',
    imageClass: 'M9.5,13.4l-2.9-2.9h3.8L12.2,7l1.4,3.5h3.8l-3,2.9l0.9,3.6L12,15.1L8.8,17L9.5,13.4z M22,6v12c0,1.1-0.9,2-2,2H4  c-1.1,0-2-0.9-2-2V6c0-1.1,0.9-2,2-2h16C21.1,4,22,4.9,22,6z M20,6H4v12h16V8.8V6z',
    imageDisplay: 'M3,5h18v2H3V5z M13,9h8v2h-8V9z M13,13h8v2h-8V13z M3,17h18v2H3V17z M3,9h8v6H3V9z',
    imageManager: 'M20,6h-7l-2-2H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8C22,6.9,21.1,6,20,6z M20,18H4V6h6.2l2,2H20V18z   M18,16l-3.8-5H14l-2.9,3.8L9,12.1L6,16H18z M10,9.5C10,8.7,9.3,8,8.5,8S7,8.7,7,9.5S7.7,11,8.5,11S10,10.3,10,9.5z',
    imageSize: 'M16.9,4c-0.3,0-0.5,0.2-0.8,0.3L3.3,13c-0.9,0.6-1.1,1.9-0.5,2.8l2.2,3.3c0.4,0.7,1.2,1,2,0.8c0.3,0,0.5-0.2,0.8-0.3  L20.7,11c0.9-0.6,1.1-1.9,0.5-2.8l-2.2-3.3C18.5,4.2,17.7,3.9,16.9,4L16.9,4z M16.9,9.9L18.1,9l-2-2.9L17,5.6c0.1,0,0.1-0.1,0.2-0.1  c0.2,0,0.4,0,0.5,0.2L19.9,9c0.2,0.2,0.1,0.5-0.1,0.7L7,18.4c-0.1,0-0.1,0.1-0.2,0.1c-0.2,0-0.4,0-0.5-0.2L4.1,15  c-0.2-0.2-0.1-0.5,0.1-0.7L5,13.7l2,2.9l1.2-0.8l-2-2.9L7.5,12l1.1,1.7l1.2-0.8l-1.1-1.7l1.2-0.8l2,2.9l1.2-0.8l-2-2.9l1.2-0.8  l1.1,1.7l1.2-0.8l-1.1-1.7L14.9,7L16.9,9.9z',
    indent: 'M3,9v6l3-3L3,9z M3,19h18v-2H3V19z M3,7h18V5H3V7z M9,11h12V9H9V11z M9,15h12v-2H9V15z',
    inlineClass: 'M9.9,13.313A1.2,1.2,0,0,1,9.968,13H6.277l1.86-5.2,1.841,5.148A1.291,1.291,0,0,1,11.212,12h.426l-2.5-7h-2l-5,14h2l1.43-4H9.9Zm2.651,6.727a2.884,2.884,0,0,1-.655-2.018v-2.71A1.309,1.309,0,0,1,13.208,14h3.113a3.039,3.039,0,0,1,2,1.092s1.728,1.818,2.964,2.928a1.383,1.383,0,0,1,.318,1.931,1.44,1.44,0,0,1-.19.215l-3.347,3.31a1.309,1.309,0,0,1-1.832.258h0a1.282,1.282,0,0,1-.258-.257l-1.71-1.728Zm2.48-3.96a.773.773,0,1,0,.008,0Z',
    inlineStyle: 'M11.88,15h.7l.7-1.7-3-8.3h-2l-5,14h2l1.4-4Zm-4.4-2,1.9-5.2,1.9,5.2ZM15.4,21.545l3.246,1.949-.909-3.637L20.72,17H16.954l-1.429-3.506L13.837,17H10.071l2.857,2.857-.779,3.637Z',
    insertEmbed: 'M20.73889,15.45929a3.4768,3.4768,0,0,0-5.45965-.28662L9.5661,12.50861a3.49811,3.49811,0,0,0-.00873-1.01331l5.72174-2.66809a3.55783,3.55783,0,1,0-.84527-1.81262L8.70966,9.6839a3.50851,3.50851,0,1,0,.0111,4.63727l5.7132,2.66412a3.49763,3.49763,0,1,0,6.30493-1.526ZM18.00745,5.01056A1.49993,1.49993,0,1,1,16.39551,6.3894,1.49994,1.49994,0,0,1,18.00745,5.01056ZM5.99237,13.49536a1.49989,1.49989,0,1,1,1.61194-1.37878A1.49982,1.49982,0,0,1,5.99237,13.49536Zm11.78211,5.494a1.49993,1.49993,0,1,1,1.61193-1.37885A1.49987,1.49987,0,0,1,17.77448,18.98932Z',
    insertFile: 'M7,3C5.9,3,5,3.9,5,5v14c0,1.1,0.9,2,2,2h10c1.1,0,2-0.9,2-2V7.6L14.4,3H7z M17,19H7V5h6v4h4V19z',
    insertImage: 'M14.2,11l3.8,5H6l3-3.9l2.1,2.7L14,11H14.2z M8.5,11c0.8,0,1.5-0.7,1.5-1.5S9.3,8,8.5,8S7,8.7,7,9.5C7,10.3,7.7,11,8.5,11z   M22,6v12c0,1.1-0.9,2-2,2H4c-1.1,0-2-0.9-2-2V6c0-1.1,0.9-2,2-2h16C21.1,4,22,4.9,22,6z M20,8.8V6H4v12h16V8.8z',
    insertLink: 'M11,17H7A5,5,0,0,1,7,7h4V9H7a3,3,0,0,0,0,6h4ZM17,7H13V9h4a3,3,0,0,1,0,6H13v2h4A5,5,0,0,0,17,7Zm-1,4H8v2h8Z',
    insertMore: 'M16.5,13h-6v6h-2V13h-6V11h6V5h2v6h6Zm5,4.5A1.5,1.5,0,1,1,20,16,1.5,1.5,0,0,1,21.5,17.5Zm0-4A1.5,1.5,0,1,1,20,12,1.5,1.5,0,0,1,21.5,13.5Zm0-4A1.5,1.5,0,1,1,20,8,1.5,1.5,0,0,1,21.5,9.5Z',
    insertTable: 'M20,5H4C2.9,5,2,5.9,2,7v2v1.5v3V15v2c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2v-2v-1.5v-3V9V7C22,5.9,21.1,5,20,5z M9.5,13.5v-3  h5v3H9.5z M14.5,15v2.5h-5V15H14.5z M9.5,9V6.5h5V9H9.5z M3.5,7c0-0.3,0.2-0.5,0.5-0.5h4V9H3.5V7z M3.5,10.5H8v3H3.5V10.5z M3.5,17  v-2H8v2.5H4C3.7,17.5,3.5,17.3,3.5,17z M20.5,17c0,0.3-0.2,0.5-0.5,0.5h-4V15h4.5V17z M20.5,13.5H16v-3h4.5V13.5z M16,9V6.5h4  c0.3,0,0.5,0.2,0.5,0.5v2H16z',
    insertVideo: 'M15,8v8H5V8H15m2,2.5V7a1,1,0,0,0-1-1H4A1,1,0,0,0,3,7V17a1,1,0,0,0,1,1H16a1,1,0,0,0,1-1V13.5l2.29,2.29A1,1,0,0,0,21,15.08V8.91a1,1,0,0,0-1.71-.71Z',
    upload: 'M12 6.66667a4.87654 4.87654 0 0 1 4.77525 3.92342l0.29618 1.50268 1.52794 0.10578a2.57021 2.57021 0 0 1 -0.1827 5.13478H6.5a3.49774 3.49774 0 0 1 -0.3844 -6.97454l1.06682 -0.11341L7.678 9.29387A4.86024 4.86024 0 0 1 12 6.66667m0 -2A6.871 6.871 0 0 0 5.90417 8.37 5.49773 5.49773 0 0 0 6.5 19.33333H18.41667a4.57019 4.57019 0 0 0 0.32083 -9.13A6.86567 6.86567 0 0 0 12 4.66667Zm0.99976 7.2469h1.91406L11.99976 9 9.08618 11.91357h1.91358v3H11V16h2V14h-0.00024Z',
    italic: 'M11.76,9h2l-2.2,10h-2Zm1.68-4a1,1,0,1,0,1,1,1,1,0,0,0-1-1Z',
    search: 'M15.5 14h-0.79l-0.28 -0.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09 -0.59 4.23 -1.57l0.27 0.28v0.79l5 4.99L20.49 19l-4.99 -5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    lineHeight: 'M6.25,7h2.5L5.25,3.5,1.75,7h2.5V17H1.75l3.5,3.5L8.75,17H6.25Zm4-2V7h12V5Zm0,14h12V17h-12Zm0-6h12V11h-12Z',
    linkStyles: 'M19,17.9l0.9,3.6l-3.2-1.9l-3.3,1.9l0.8-3.6L11.3,15h3.8l1.7-3.5l1.4,3.5H22L19,17.9z M20,12c0,0.3-0.1,0.7-0.2,1h2.1  c0.1-0.3,0.1-0.6,0.1-1c0-2.8-2.2-5-5-5h-4v2h4C18.7,9,20,10.3,20,12z M14.8,11H8v2h3.3h2.5L14.8,11z M9.9,16.4L8.5,15H7  c-1.7,0-3-1.3-3-3s1.3-3,3-3h4V7H7c-2.8,0-5,2.2-5,5s2.2,5,5,5h3.5L9.9,16.4z',
    mention: 'M12.4,5c-4.1,0-7.5,3.4-7.5,7.5S8.3,20,12.4,20h3.8v-1.5h-3.8c-3.3,0-6-2.7-6-6s2.7-6,6-6s6,2.7,6,6v1.1  c0,0.6-0.5,1.2-1.1,1.2s-1.1-0.6-1.1-1.2v-1.1c0-2.1-1.7-3.8-3.8-3.8s-3.7,1.7-3.7,3.8s1.7,3.8,3.8,3.8c1,0,2-0.4,2.7-1.1  c0.5,0.7,1.3,1.1,2.2,1.1c1.5,0,2.6-1.2,2.6-2.7v-1.1C19.9,8.4,16.6,5,12.4,5z M12.4,14.7c-1.2,0-2.3-1-2.3-2.2s1-2.3,2.3-2.3  s2.3,1,2.3,2.3S13.6,14.7,12.4,14.7z',
    more: 'M13.5,17c0,0.8-0.7,1.5-1.5,1.5s-1.5-0.7-1.5-1.5s0.7-1.5,1.5-1.5S13.5,16.2,13.5,17z M13.5,12c0,0.8-0.7,1.5-1.5,1.5 s-1.5-0.7-1.5-1.5s0.7-1.5,1.5-1.5S13.5,11.2,13.5,12z M13.5,7c0,0.8-0.7,1.5-1.5,1.5S10.5,7.8,10.5,7s0.7-1.5,1.5-1.5 S13.5,6.2,13.5,7z',
    openLink: 'M17,17H7V7h3V5H7C6,5,5,6,5,7v10c0,1,1,2,2,2h10c1,0,2-1,2-2v-3h-2V17z M14,5v2h1.6l-5.8,5.8l1.4,1.4L17,8.4V10h2V5H14z',
    orderedList: 'M2.5,16h2v.5h-1v1h1V18h-2v1h3V15h-3Zm1-7h1V5h-2V6h1Zm-1,2H4.3L2.5,13.1V14h3V13H3.7l1.8-2.1V10h-3Zm5-5V8h14V6Zm0,12h14V16H7.5Zm0-5h14V11H7.5Z',
    outdent: 'M3,12l3,3V9L3,12z M3,19h18v-2H3V19z M3,7h18V5H3V7z M9,11h12V9H9V11z M9,15h12v-2H9V15z',
    pageBreaker: 'M3,9v6l3-3L3,9z M21,9H8V4h2v3h9V4h2V9z M21,20h-2v-3h-9v3H8v-5h13V20z M11,13H8v-2h3V13z M16,13h-3v-2h3V13z M21,13h-3v-2  h3V13z',
    paragraphFormat: 'M10.15,5A4.11,4.11,0,0,0,6.08,8.18,4,4,0,0,0,10,13v6h2V7h2V19h2V7h2V5ZM8,9a2,2,0,0,1,2-2v4A2,2,0,0,1,8,9Z',
    paragraphMore: 'M7.682,5a4.11,4.11,0,0,0-4.07,3.18,4,4,0,0,0,3.11,4.725h0l.027.005a3.766,3.766,0,0,0,.82.09v6h2V7h2V19h2V7h2V5ZM5.532,9a2,2,0,0,1,2-2v4A2,2,0,0,1,5.532,9Zm14.94,8.491a1.5,1.5,0,1,1-1.5-1.5A1.5,1.5,0,0,1,20.472,17.491Zm0-4a1.5,1.5,0,1,1-1.5-1.5A1.5,1.5,0,0,1,20.472,13.491Zm0-4a1.5,1.5,0,1,1-1.5-1.5A1.5,1.5,0,0,1,20.472,9.491Z',
    paragraphStyle: 'M4,9c0-1.1,0.9-2,2-2v4C4.9,11,4,10.1,4,9z M16.7,20.5l3.2,1.9L19,18.8l3-2.9h-3.7l-1.4-3.5L15.3,16h-3.8l2.9,2.9l-0.9,3.6  L16.7,20.5z M10,17.4V19h1.6L10,17.4z M6.1,5c-1.9,0-3.6,1.3-4,3.2c-0.5,2.1,0.8,4.2,2.9,4.7c0,0,0,0,0,0h0.2C5.5,13,5.8,13,6,13v6  h2V7h2v7h2V7h2V5H6.1z',
    pdfExport: 'M7,3C5.9,3,5,3.9,5,5v14c0,1.1,0.9,2,2,2h10c1.1,0,2-0.9,2-2V7.6L14.4,3H7z M17,19H7V5h6v4h4V19z M16.3,13.5  c-0.2-0.6-1.1-0.8-2.6-0.8c-0.1,0-0.1,0-0.2,0c-0.3-0.3-0.8-0.9-1-1.2c-0.2-0.2-0.3-0.3-0.4-0.6c0.2-0.7,0.2-1,0.3-1.5  c0.1-0.9,0-1.6-0.2-1.8c-0.4-0.2-0.7-0.2-0.9-0.2c-0.1,0-0.3,0.2-0.7,0.7c-0.2,0.7-0.1,1.8,0.6,2.8c-0.2,0.8-0.7,1.6-1,2.4  c-0.8,0.2-1.5,0.7-1.9,1.1c-0.7,0.7-0.9,1.1-0.7,1.6c0,0.3,0.2,0.6,0.7,0.6c0.3-0.1,0.3-0.2,0.7-0.3c0.6-0.3,1.2-1.7,1.7-2.4  c0.8-0.2,1.7-0.3,2-0.3c0.1,0,0.3,0,0.6,0c0.8,0.8,1.2,1.1,1.8,1.2c0.1,0,0.2,0,0.3,0c0.3,0,0.8-0.1,1-0.6  C16.4,14.1,16.4,13.9,16.3,13.5z M8.3,15.7c-0.1,0.1-0.2,0.1-0.2,0.1c0-0.1,0-0.3,0.6-0.8c0.2-0.2,0.6-0.3,0.9-0.7  C9,15,8.6,15.5,8.3,15.7z M11.3,9c0-0.1,0.1-0.2,0.1-0.2S11.6,9,11.5,10c0,0.1,0,0.3-0.1,0.7C11.3,10.1,11,9.5,11.3,9z M10.9,13.1  c0.2-0.6,0.6-1,0.7-1.5c0.1,0.1,0.1,0.1,0.2,0.2c0.1,0.2,0.3,0.7,0.7,0.9C12.2,12.8,11.6,13,10.9,13.1z M15.2,14.1  c-0.1,0-0.1,0-0.2,0c-0.2,0-0.7-0.2-1-0.7c1.1,0,1.6,0.2,1.6,0.6C15.5,14.1,15.4,14.1,15.2,14.1z',
    print: 'M16.1,17c0-0.6,0.4-1,1-1c0.6,0,1,0.4,1,1s-0.4,1-1,1C16.5,18,16.1,17.6,16.1,17z M22,15v4c0,1.1-0.9,2-2,2H4  c-1.1,0-2-0.9-2-2v-4c0-1.1,0.9-2,2-2h1V5c0-1.1,0.9-2,2-2h7.4L19,7.6V13h1C21.1,13,22,13.9,22,15z M7,13h10V9h-4V5H7V13z M20,15H4  v4h16V15z',
    redo: 'M13.6,9.4c1.7,0.3,3.2,0.9,4.6,2L21,8.5v7h-7l2.7-2.7C13,10.1,7.9,11,5.3,14.7c-0.2,0.3-0.4,0.5-0.5,0.8L3,14.6  C5.1,10.8,9.3,8.7,13.6,9.4z',
    removeTable: 'M15,10v8H9v-8H15 M14,4H9.9l-1,1H6v2h12V5h-3L14,4z M17,8H7v10c0,1.1,0.9,2,2,2h6c1.1,0,2-0.9,2-2V8z',
    remove: 'M15,10v8H9v-8H15 M14,4H9.9l-1,1H6v2h12V5h-3L14,4z M17,8H7v10c0,1.1,0.9,2,2,2h6c1.1,0,2-0.9,2-2V8z',
    replaceImage: 'M16,5v3H4v2h12v3l4-4L16,5z M8,19v-3h12v-2H8v-3l-4,4L8,19z',
    row: 'M20,5H4C2.9,5,2,5.9,2,7v2v1.5v3V15v2c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2v-2v-1.5v-3V9V7C22,5.9,21.1,5,20,5z M16,6.5h4  c0.3,0,0.5,0.2,0.5,0.5v2H16V6.5z M9.5,6.5h5V9h-5V6.5z M3.5,7c0-0.3,0.2-0.5,0.5-0.5h4V9H3.5V7z M8,17.5H4c-0.3,0-0.5-0.2-0.5-0.5  v-2H8V17.5z M14.5,17.5h-5V15h5V17.5z M20.5,17c0,0.3-0.2,0.5-0.5,0.5h-4V15h4.5V17z',
    selectAll: 'M5,7h2V5C5.9,5,5,5.9,5,7z M5,11h2V9H5V11z M9,19h2v-2H9V19z M5,11h2V9H5V11z M15,5h-2v2h2V5z M17,5v2h2C19,5.9,18.1,5,17,5  z M7,19v-2H5C5,18.1,5.9,19,7,19z M5,15h2v-2H5V15z M11,5H9v2h2V5z M13,19h2v-2h-2V19z M17,11h2V9h-2V11z M17,19c1.1,0,2-0.9,2-2h-2  V19z M17,11h2V9h-2V11z M17,15h2v-2h-2V15z M13,19h2v-2h-2V19z M13,7h2V5h-2V7z M9,15h6V9H9V15z M11,11h2v2h-2V11z',
    smile: 'M11.991,3A9,9,0,1,0,21,12,8.99557,8.99557,0,0,0,11.991,3ZM12,19a7,7,0,1,1,7-7A6.99808,6.99808,0,0,1,12,19Zm3.105-5.2h1.503a4.94542,4.94542,0,0,1-9.216,0H8.895a3.57808,3.57808,0,0,0,6.21,0ZM7.5,9.75A1.35,1.35,0,1,1,8.85,11.1,1.35,1.35,0,0,1,7.5,9.75Zm6.3,0a1.35,1.35,0,1,1,1.35,1.35A1.35,1.35,0,0,1,13.8,9.75Z',
    spellcheck: 'M19.1,13.6l-5.6,5.6l-2.7-2.7l-1.4,1.4l4.1,4.1l7-7L19.1,13.6z M10.8,13.7l2.7,2.7l0.8-0.8L10.5,5h-2l-5,14h2l1.4-4h2.6  L10.8,13.7z M9.5,7.8l1.9,5.2H7.6L9.5,7.8z',
    star: 'M12.1,7.7l1,2.5l0.4,0.9h1h2.4l-2.1,2l-0.6,0.6l0.2,0.9l0.6,2.3l-2.2-1.3L12,15.2l-0.8,0.5L9,17l0.5-2.5l0.1-0.8L9,13.1  l-2-2h2.5h0.9l0.4-0.8L12.1,7.7 M12.2,4L9.5,9.6H3.4L8,14.2L6.9,20l5.1-3.1l5.3,3.1l-1.5-5.8l4.8-4.6h-6.1L12.2,4L12.2,4z',
    strikeThrough: 'M3,12.20294H21v1.5H16.63422a3.59782,3.59782,0,0,1,.34942,1.5929,3.252,3.252,0,0,1-1.31427,2.6997A5.55082,5.55082,0,0,1,12.20251,19a6.4421,6.4421,0,0,1-2.62335-.539,4.46335,4.46335,0,0,1-1.89264-1.48816,3.668,3.668,0,0,1-.67016-2.15546V14.704h.28723v-.0011h.34149v.0011H9.02v.11334a2.18275,2.18275,0,0,0,.85413,1.83069,3.69,3.69,0,0,0,2.32836.67926,3.38778,3.38778,0,0,0,2.07666-.5462,1.73346,1.73346,0,0,0,.7013-1.46655,1.69749,1.69749,0,0,0-.647-1.43439,3.00525,3.00525,0,0,0-.27491-.17725H3ZM16.34473,7.05981A4.18163,4.18163,0,0,0,14.6236,5.5462,5.627,5.627,0,0,0,12.11072,5,5.16083,5.16083,0,0,0,8.74719,6.06213,3.36315,3.36315,0,0,0,7.44006,8.76855a3.22923,3.22923,0,0,0,.3216,1.42786h2.59668c-.08338-.05365-.18537-.10577-.25269-.16064a1.60652,1.60652,0,0,1-.65283-1.30036,1.79843,1.79843,0,0,1,.68842-1.5108,3.12971,3.12971,0,0,1,1.96948-.55243,3.04779,3.04779,0,0,1,2.106.6687,2.35066,2.35066,0,0,1,.736,1.83258v.11341h2.00317V9.17346A3.90013,3.90013,0,0,0,16.34473,7.05981Z',
    subscript: 'M10.4,12l3.6,3.6L12.6,17L9,13.4L5.4,17L4,15.6L7.6,12L4,8.4L5.4,7L9,10.6L12.6,7L14,8.4L10.4,12z M18.31234,19.674  l1.06812-1.1465c0.196-0.20141,0.37093-0.40739,0.5368-0.6088c0.15975-0.19418,0.30419-0.40046,0.432-0.617  c0.11969-0.20017,0.21776-0.41249,0.29255-0.6334c0.07103-0.21492,0.10703-0.43986,0.10662-0.66621  c0.00297-0.28137-0.04904-0.56062-0.1531-0.82206c-0.09855-0.24575-0.25264-0.46534-0.45022-0.6416  c-0.20984-0.18355-0.45523-0.32191-0.72089-0.40646c-0.63808-0.19005-1.3198-0.17443-1.94851,0.04465  c-0.28703,0.10845-0.54746,0.2772-0.76372,0.49487c-0.20881,0.20858-0.37069,0.45932-0.47483,0.73548  c-0.10002,0.26648-0.15276,0.54838-0.15585,0.833l-0.00364,0.237H17.617l0.00638-0.22692  c0.00158-0.12667,0.01966-0.25258,0.05377-0.37458c0.03337-0.10708,0.08655-0.20693,0.15679-0.29437  c0.07105-0.08037,0.15959-0.14335,0.25882-0.1841c0.22459-0.08899,0.47371-0.09417,0.7018-0.01458  c0.0822,0.03608,0.15559,0.08957,0.21509,0.15679c0.06076,0.07174,0.10745,0.15429,0.13761,0.24333  c0.03567,0.10824,0.05412,0.22141,0.05469,0.33538c-0.00111,0.08959-0.0118,0.17881-0.0319,0.26612  c-0.02913,0.10428-0.07076,0.20465-0.124,0.29893c-0.07733,0.13621-0.1654,0.26603-0.26338,0.38823  c-0.13438,0.17465-0.27767,0.34226-0.42929,0.50217l-2.15634,2.35315V21H21v-1.326H18.31234z',
    superscript: 'M10.4,12,14,15.6,12.6,17,9,13.4,5.4,17,4,15.6,7.6,12,4,8.4,5.4,7,9,10.6,12.6,7,14,8.4Zm8.91234-3.326,1.06812-1.1465c.196-.20141.37093-.40739.5368-.6088a4.85745,4.85745,0,0,0,.432-.617,3.29,3.29,0,0,0,.29255-.6334,2.11079,2.11079,0,0,0,.10662-.66621,2.16127,2.16127,0,0,0-.1531-.82206,1.7154,1.7154,0,0,0-.45022-.6416,2.03,2.03,0,0,0-.72089-.40646,3.17085,3.17085,0,0,0-1.94851.04465,2.14555,2.14555,0,0,0-.76372.49487,2.07379,2.07379,0,0,0-.47483.73548,2.446,2.446,0,0,0-.15585.833l-.00364.237H18.617L18.62338,5.25a1.45865,1.45865,0,0,1,.05377-.37458.89552.89552,0,0,1,.15679-.29437.70083.70083,0,0,1,.25882-.1841,1.00569,1.00569,0,0,1,.7018-.01458.62014.62014,0,0,1,.21509.15679.74752.74752,0,0,1,.13761.24333,1.08893,1.08893,0,0,1,.05469.33538,1.25556,1.25556,0,0,1-.0319.26612,1.34227,1.34227,0,0,1-.124.29893,2.94367,2.94367,0,0,1-.26338.38823,6.41629,6.41629,0,0,1-.42929.50217L17.19709,8.92642V10H22V8.674Z',
    symbols: 'M15.77493,16.98885a8.21343,8.21343,0,0,0,1.96753-2.57651,7.34824,7.34824,0,0,0,.6034-3.07618A6.09092,6.09092,0,0,0,11.99515,5a6.13347,6.13347,0,0,0-4.585,1.79187,6.417,6.417,0,0,0-1.756,4.69207,6.93955,6.93955,0,0,0,.622,2.97415,8.06587,8.06587,0,0,0,1.949,2.53076H5.41452V19h5.54114v-.04331h-.00147V16.84107a5.82825,5.82825,0,0,1-2.2052-2.2352A6.40513,6.40513,0,0,1,7.97672,11.447,4.68548,4.68548,0,0,1,9.07785,8.19191a3.73232,3.73232,0,0,1,2.9173-1.22462,3.76839,3.76839,0,0,1,2.91241,1.21489,4.482,4.482,0,0,1,1.11572,3.154,6.71141,6.71141,0,0,1-.75384,3.24732,5.83562,5.83562,0,0,1-2.22357,2.25759v2.11562H13.0444V19h5.54108V16.98885Z',
    tags: 'M8.9749 7.47489a1.5 1.5 0 1 1 -1.5 1.5A1.5 1.5 0 0 1 8.9749 7.47489Zm3.78866 -3.12713L16.5362 8.12041l0.33565 0.33564 2.77038 2.77038a2.01988 2.01988 0 0 1 0.59 1.42 1.95518 1.95518 0 0 1 -0.5854 1.40455l0.00044 0.00043 -5.59583 5.59583 -0.00043 -0.00044a1.95518 1.95518 0 0 1 -1.40455 0.5854 1.98762 1.98762 0 0 1 -1.41 -0.58L8.45605 16.87185l-0.33564 -0.33565L4.35777 12.77357a1.99576 1.99576 0 0 1 -0.59 -1.42V9.36358l0 -3.59582a2.00579 2.00579 0 0 1 2 -2l3.59582 0h1.98995A1.98762 1.98762 0 0 1 12.76356 4.34776ZM15.46186 9.866l-0.33564 -0.33564L11.36359 5.76776H5.76776v5.59583L9.866 15.46186l2.7794 2.7794 5.5878 -5.60385 -0.001 -0.001Z',
    tableHeader: 'M20,5H4C2.9,5,2,5.9,2,7v10c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V7C22,5.9,21.1,5,20,5z M8,17.5H4c-0.3,0-0.5-0.2-0.5-0.4  l0,0V17v-2H8V17.5z M8,13.5H3.5v-3H8V13.5z M14.5,17.5h-5V15h5V17.5z M14.5,13.5h-5v-3h5V13.5z M20.5,17c0,0.3-0.2,0.5-0.4,0.5l0,0  H16V15h4.5V17z M20.5,13.5H16v-3h4.5V13.5z M20.5,9h-4.4H16h-1.5h-5H8H7.9H3.5V7c0-0.3,0.2-0.5,0.4-0.5l0,0h4l0,0h8.2l0,0H20  c0.3,0,0.5,0.2,0.5,0.4l0,0V9z',
    tableStyle: 'M20.0171,19.89752l.9,3.6-3.2-1.9-3.3,1.9.8-3.6-2.9-2.9h3.8l1.7-3.5,1.4,3.5h3.8ZM20,5H4A2.00591,2.00591,0,0,0,2,7V17a2.00591,2.00591,0,0,0,2,2h7.49115l-.58826-.58826L9.99115,17.5H9.5V14.9975h5.36511L16,12.66089V10.5h4.5v3h-.52783l.599,1.4975H22V7A2.00591,2.00591,0,0,0,20,5ZM3.5,7A.4724.4724,0,0,1,4,6.5H8V9H3.5Zm0,3.5H8v3H3.5Zm.5,7a.4724.4724,0,0,1-.5-.5V15H8v2.5Zm10.5-4h-5v-3h5Zm0-4.5h-5V6.5h5Zm6,0H16V6.5h4a.4724.4724,0,0,1,.5.5Z',
    textColor: 'M15.2,13.494s-3.6,3.9-3.6,6.3a3.65,3.65,0,0,0,7.3.1v-.1C18.9,17.394,15.2,13.494,15.2,13.494Zm-1.47-1.357.669-.724L12.1,5h-2l-5,14h2l1.43-4h2.943A24.426,24.426,0,0,1,13.726,12.137ZM11.1,7.8l1.86,5.2H9.244Z',
    textMore: 'M13.55,19h2l-5-14h-2l-5,14h2l1.4-4h5.1Zm-5.9-6,1.9-5.2,1.9,5.2Zm12.8,4.5a1.5,1.5,0,1,1-1.5-1.5A1.5,1.5,0,0,1,20.45,17.5Zm0-4a1.5,1.5,0,1,1-1.5-1.5A1.5,1.5,0,0,1,20.45,13.5Zm0-4A1.5,1.5,0,1,1,18.95,8,1.5,1.5,0,0,1,20.45,9.5Z',
    underline: 'M19,20v2H5V20Zm-3-6.785a4,4,0,0,1-5.74,3.4A3.75,3.75,0,0,1,8,13.085V5.005H6v8.21a6,6,0,0,0,8,5.44,5.851,5.851,0,0,0,4-5.65v-8H16ZM16,5v0h2V5ZM8,5H6v0H8Z',
    undo: 'M10.4,9.4c-1.7,0.3-3.2,0.9-4.6,2L3,8.5v7h7l-2.7-2.7c3.7-2.6,8.8-1.8,11.5,1.9c0.2,0.3,0.4,0.5,0.5,0.8l1.8-0.9  C18.9,10.8,14.7,8.7,10.4,9.4z',
    unlink: 'M14.4,11l1.6,1.6V11H14.4z M17,7h-4v1.9h4c1.7,0,3.1,1.4,3.1,3.1c0,1.3-0.8,2.4-1.9,2.8l1.4,1.4C21,15.4,22,13.8,22,12  C22,9.2,19.8,7,17,7z M2,4.3l3.1,3.1C3.3,8.1,2,9.9,2,12c0,2.8,2.2,5,5,5h4v-1.9H7c-1.7,0-3.1-1.4-3.1-3.1c0-1.6,1.2-2.9,2.8-3.1  L8.7,11H8v2h2.7l2.3,2.3V17h1.7l4,4l1.4-1.4L3.4,2.9L2,4.3z',
    unorderedList: 'M4,10.5c-0.8,0-1.5,0.7-1.5,1.5s0.7,1.5,1.5,1.5s1.5-0.7,1.5-1.5S4.8,10.5,4,10.5z M4,5.5C3.2,5.5,2.5,6.2,2.5,7  S3.2,8.5,4,8.5S5.5,7.8,5.5,7S4.8,5.5,4,5.5z M4,15.5c-0.8,0-1.5,0.7-1.5,1.5s0.7,1.5,1.5,1.5s1.5-0.7,1.5-1.5S4.8,15.5,4,15.5z   M7.5,6v2h14V6H7.5z M7.5,18h14v-2h-14V18z M7.5,13h14v-2h-14V13z',
    verticalAlignBottom: 'M16,13h-3V3h-2v10H8l4,4L16,13z M3,19v2h18v-2H3z',
    verticalAlignMiddle: 'M3,11v2h18v-2H3z M8,18h3v3h2v-3h3l-4-4L8,18z M16,6h-3V3h-2v3H8l4,4L16,6z',
    verticalAlignTop: 'M8,11h3v10h2V11h3l-4-4L8,11z M21,5V3H3v2H21z'
  };

  FroalaEditor.MODULES.modals = function (editor) {
    var $ = editor.$;

    if (!editor.shared.modals) {
      editor.shared.modals = {};
    }

    var modals = editor.shared.modals;
    var $overlay;
    /**
     * Get the modal with the specific id.
     */

    function get(id) {
      return modals[id];
    }
    /*
     *  Get modal html
     */


    function _modalHTML(head, body) {
      // Modal wrapper.
      var html = "<div tabIndex=\"-1\" class=\"fr-modal".concat(editor.opts.theme ? " ".concat(editor.opts.theme, "-theme") : '', "\"><div class=\"fr-modal-wrapper\">"); // Modal title.

      var close_button = "<button title=\"".concat(editor.language.translate('Cancel'), "\" class=\"fr-command fr-btn fr-modal-close\"><svg xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\" viewBox=\"0 0 24 24\"><path d=\"").concat(FroalaEditor.SVG.close, "\"/></svg></button>");
      html += "<div class=\"fr-modal-head\">".concat(head).concat(close_button, "</div>"); // Body.

      html += "<div tabIndex=\"-1\" class=\"fr-modal-body\">".concat(body, "</div>"); // End Modal.

      html += '</div></div>';
      var $tmp = $(editor.doc.createElement('DIV'));
      $tmp.html(html);
      return $tmp.find('> .fr-modal');
    }
    /*
     * Create modal.
     */


    function create(id, head, body) {
      // Wrap all head elements inside a div
      head = "<div class=\"fr-modal-head-line\">".concat(head, "</div>"); // Build modal overlay.

      if (!editor.shared.$overlay) {
        editor.shared.$overlay = $(editor.doc.createElement('DIV')).addClass('fr-overlay');
        $('body').first().append(editor.shared.$overlay);
      }

      $overlay = editor.shared.$overlay;

      if (editor.opts.theme) {
        $overlay.addClass("".concat(editor.opts.theme, "-theme"));
      } // Build modal.


      if (!modals[id]) {
        var $modal = _modalHTML(head, body);

        modals[id] = {
          $modal: $modal,
          $head: $modal.find('.fr-modal-head'),
          $body: $modal.find('.fr-modal-body') // Desktop or mobile device.

        };

        if (!editor.helpers.isMobile()) {
          $modal.addClass('fr-desktop');
        } // Append modal to body.


        $('body').first().append($modal); // Click on close button.

        editor.events.$on($modal, 'click', '.fr-modal-close', function () {
          hide(id);
        }, true);
        modals[id].$body.css('margin-top', modals[id].$head.outerHeight()); // Keydown handler.

        editor.events.$on($modal, 'keydown', function (e) {
          var keycode = e.which; // Esc.

          if (keycode === FroalaEditor.KEYCODE.ESC) {
            hide(id);
            editor.accessibility.focusModalButton($modal);
            return false;
          } else if (!$(e.currentTarget).is('input[type=text], textarea') && keycode !== FroalaEditor.KEYCODE.ARROW_UP && keycode !== FroalaEditor.KEYCODE.ARROW_DOWN && !editor.keys.isBrowserAction(e)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }

          return true;
        }, true);
        hide(id, true);
      }

      return modals[id];
    }
    /*
     * Destroy modals.
     */


    function destroy() {
      // Destroy all modals.
      for (var i in modals) {
        if (Object.prototype.hasOwnProperty.call(modals, i)) {
          var modalHash = modals[i];

          if (modalHash && modalHash.$modal) {
            modalHash.$modal.removeData().remove();
          }
        }
      }

      if ($overlay) {
        $overlay.removeData().remove();
      }

      modals = {};
    }
    /*
     * Show modal.
     */


    function show(id) {
      if (!modals[id]) {
        return;
      }

      var $modal = modals[id].$modal; // Set the current instance for the modal.

      $modal.data('instance', editor); // Show modal.

      $modal.show();
      $overlay.show(); // Prevent scrolling in page.

      $(editor.o_doc).find('body').first().addClass('prevent-scroll'); // Mobile device

      if (editor.helpers.isMobile()) {
        $(editor.o_doc).find('body').first().addClass('fr-mobile');
      }

      $modal.addClass('fr-active');
      editor.accessibility.focusModal($modal);
    }
    /*
     * Hide modal.
     */


    function hide(id, init) {
      if (!modals[id]) {
        return;
      }

      var $modal = modals[id].$modal;
      var inst = $modal.data('instance') || editor;
      inst.events.enableBlur();
      $modal.hide();
      $overlay.hide();
      $(inst.o_doc).find('body').first().removeClass('prevent-scroll fr-mobile');
      $modal.removeClass('fr-active');

      if (!init) {
        // Restore selection.
        inst.accessibility.restoreSelection();
        inst.events.trigger('modals.hide');
      }
    }
    /**
     *  Resize modal according to its body or editor heights.
     */


    function resize(id) {
      if (!modals[id]) {
        return;
      }

      var modalHash = modals[id];
      var $modal = modalHash.$modal;
      var $body = modalHash.$body;
      var height = editor.o_win.innerHeight; // The wrapper object.

      var $wrapper = $modal.find('.fr-modal-wrapper'); // Calculate max allowed height.

      var allWrapperHeight = $wrapper.outerHeight(true);
      var exteriorBodyHeight = $wrapper.height() - ($body.outerHeight(true) - $body.height());
      var maxHeight = height - allWrapperHeight + exteriorBodyHeight; // Get body content height.

      var body_content_height = $body.get(0).scrollHeight; // Calculate the new height.

      var newHeight = 'auto';

      if (body_content_height > maxHeight) {
        newHeight = maxHeight;
      }

      $body.height(newHeight);
    }
    /**
     * Find visible modal.
     */


    function isVisible(id) {
      var $modal; // By id.

      if (typeof id === 'string') {
        if (!modals[id]) {
          return;
        }

        $modal = modals[id].$modal;
      } // By modal object.
      else {
          $modal = id;
        }

      return $modal && editor.node.hasClass($modal, 'fr-active') && editor.core.sameInstance($modal) || false;
    }
    /**
     * Check if there is any modal visible.
     */


    function areVisible(new_instance) {
      for (var id in modals) {
        if (Object.prototype.hasOwnProperty.call(modals, id)) {
          if (isVisible(id) && (typeof new_instance === 'undefined' || modals[id].$modal.data('instance') === new_instance)) {
            return modals[id].$modal;
          }
        }
      }

      return false;
    }
    /**
     * Initialization.
     */


    function _init() {
      editor.events.on('shared.destroy', destroy, true);
    }

    return {
      _init: _init,
      get: get,
      create: create,
      show: show,
      hide: hide,
      resize: resize,
      isVisible: isVisible,
      areVisible: areVisible
    };
  };

  FroalaEditor.MODULES.position = function (editor) {
    var $ = editor.$;
    /**
    * Get bounding rect around selection.
    *
    */

    function getBoundingRect() {
      var range = editor.selection.ranges(0);
      var boundingRect = range.getBoundingClientRect();

      if (boundingRect.top === 0 && boundingRect.left === 0 && boundingRect.width === 0 || boundingRect.height === 0) {
        var remove = false;

        if (editor.$el.find('.fr-marker').length === 0) {
          editor.selection.save();
          remove = true;
        }

        var $marker = editor.$el.find('.fr-marker').first();
        $marker.css('display', 'inline');
        $marker.css('line-height', '');
        var offset = $marker.offset();
        var height = $marker.outerHeight();
        $marker.css('display', 'none');
        $marker.css('line-height', 0);
        boundingRect = {};
        boundingRect.left = offset && offset.left;
        boundingRect.width = 0;
        boundingRect.height = height;
        boundingRect.top = offset && offset.top - (editor.helpers.isMobile() && !editor.helpers.isIOS() || editor.opts.iframe ? 0 : editor.helpers.scrollTop());
        boundingRect.right = 1;
        boundingRect.bottom = 1;
        boundingRect.ok = true;

        if (remove) {
          editor.selection.restore();
        }
      }

      return boundingRect;
    }
    /**
     * Normalize top positioning.
     */


    function _topNormalized($el, top, obj_height) {
      var height = $el.outerHeight(true);

      if (!editor.helpers.isMobile() && editor.$tb && $el.parent().get(0) !== editor.$tb.get(0)) {
        // Get the parent of the element.
        var p_offset = $el.parent().offset().top;
        var new_top = top - height - (obj_height || 0); // Parent is scrollable container.
        // Substract the top of the container.

        if ($el.parent().get(0) === editor.$sc.get(0)) {
          p_offset -= $el.parent().position().top;
        } // Scrollable container height.


        var s_height = editor.$sc.get(0).clientHeight; // 1. Parent offset + toolbar top + toolbar height > scrollableContainer height.
        // 2. Selection doesn't go above the screen.

        if (p_offset + top + height > editor.$sc.offset().top + s_height && $el.parent().offset().top + new_top > 0 && new_top > 0) {
          // Make sure we can display it.
          if (new_top > editor.$wp.scrollTop()) {
            top = new_top;
            $el.addClass('fr-above');
          }
        } else {
          $el.removeClass('fr-above');
        }
      }

      return top;
    }
    /**
     * Normalize left position.
     */


    function _leftNormalized($el, left) {
      var width = $el.outerWidth(true); // Normalize right.

      if (left + width > editor.$sc.get(0).clientWidth - 10) {
        left = editor.$sc.get(0).clientWidth - width - 10;
      } // Normalize left.


      if (left < 0) {
        left = 10;
      }

      return left;
    }
    /**
     * Place editor below selection.
     */


    function forSelection($el) {
      var selection_rect = getBoundingRect();
      $el.css({
        top: 0,
        left: 0
      });
      var top = selection_rect.top + selection_rect.height;
      var left = selection_rect.left + selection_rect.width / 2 - $el.get(0).offsetWidth / 2 + editor.helpers.scrollLeft();

      if (!editor.opts.iframe) {
        top += editor.helpers.scrollTop();
      }

      at(left, top, $el, selection_rect.height);
    }
    /**
     * Position element at the specified position.
     */


    function at(left, top, $el, obj_height) {
      var $container = $el.data('container');

      if ($container && ($container.get(0).tagName !== 'BODY' || $container.css('position') !== 'static')) {
        if (left) {
          left -= $container.offset().left;
        }

        if (top) {
          top -= $container.offset().top;
        }

        if ($container.get(0).tagName !== 'BODY') {
          if (left) {
            left += $container.get(0).scrollLeft;
          }

          if (top) {
            top += $container.get(0).scrollTop;
          }
        } else if ($container.css('position') === 'absolute') {
          if (left) {
            left += $container.position().left;
          }

          if (top) {
            top += $container.position().top;
          }
        }
      } // Apply iframe correction.


      if (editor.opts.iframe && $container && editor.$tb && $container.get(0) !== editor.$tb.get(0)) {
        var iframePaddingTop = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-top'));
        var iframePaddingLeft = editor.helpers.getPX(editor.$wp.find('.fr-iframe').css('padding-left'));

        if (left) {
          left += editor.$iframe.offset().left + iframePaddingLeft;
        }

        if (top) {
          top += editor.$iframe.offset().top + iframePaddingTop;
        }
      }

      var new_left = _leftNormalized($el, left);

      if (left) {
        // Set the new left.
        $el.css('left', new_left);
      }

      if (top) {
        $el.css('top', _topNormalized($el, top, obj_height));
      }
    }
    /**
     * Special case for update sticky on iOS.
     */


    function _updateIOSSticky(el) {
      var $el = $(el);
      var is_on = $el.is('.fr-sticky-on');
      var prev_top = $el.data('sticky-top');
      var scheduled_top = $el.data('sticky-scheduled'); // Create a dummy div that we show then sticky is on.

      if (typeof prev_top === 'undefined') {
        $el.data('sticky-top', 0);
        var $dummy = $("<div class=\"fr-sticky-dummy\" style=\"height: ".concat($el.outerHeight(), "px;\"></div>"));
        editor.$box.prepend($dummy);
      } else {
        editor.$box.find('.fr-sticky-dummy').css('height', $el.outerHeight());
      } // Position sticky doesn't work when the keyboard is on the screen.


      if (editor.core.hasFocus() || editor.$tb.findVisible('input:focus').length > 0) {
        // Get the current scroll.
        var x_scroll = editor.helpers.scrollTop(); // Get the current top.
        // We make sure that we keep it within the editable box.

        var x_top = Math.min(Math.max(x_scroll - editor.$tb.parent().offset().top, 0), editor.$tb.parent().outerHeight() - $el.outerHeight()); // Not the same top and different than the already scheduled.

        if (x_top !== prev_top && x_top !== scheduled_top) {
          // Clear any too soon change to avoid flickering.
          clearTimeout($el.data('sticky-timeout')); // Store the current scheduled top.

          $el.data('sticky-scheduled', x_top); // Hide the toolbar for a rich experience.

          if ($el.outerHeight() < x_scroll - editor.$tb.parent().offset().top) {
            $el.addClass('fr-opacity-0');
          } // Set the timeout for changing top.
          // Based on the test 100ms seems to be the best timeout.


          $el.data('sticky-timeout', setTimeout(function () {
            // Get the current top.
            var c_scroll = editor.helpers.scrollTop();
            var c_top = Math.min(Math.max(c_scroll - editor.$tb.parent().offset().top, 0), editor.$tb.parent().outerHeight() - $el.outerHeight());

            if (c_top > 0 && editor.$tb.parent().get(0).tagName === 'BODY') {
              c_top += editor.$tb.parent().position().top;
            } // Don't update if it is not different than the prev top.


            if (c_top !== prev_top) {
              $el.css('top', Math.max(c_top, 0));
              $el.data('sticky-top', c_top);
              $el.data('sticky-scheduled', c_top);
            } // Show toolbar.


            $el.removeClass('fr-opacity-0');
          }, 100));
        } // Turn on sticky mode.


        if (!is_on) {
          var $parent = editor.$tb.parent();
          var parentBorderWidth = $parent.get(0).offsetWidth - $parent.get(0).clientWidth;
          $el.css('top', '0');
          $el.width($parent.width() - parentBorderWidth);
          $el.addClass('fr-sticky-on');
          editor.$box.addClass('fr-sticky-box');
        }
      } // Turn off sticky mode.
      else {
          clearTimeout($(el).css('sticky-timeout'));
          $el.css('top', '0');
          $el.css('position', '');
          $el.css('width', '');
          $el.data('sticky-top', 0);
          $el.removeClass('fr-sticky-on');
          editor.$box.removeClass('fr-sticky-box');
        }
    }
    /**
     * Update sticky location for browsers that don't support sticky.
     * https://github.com/filamentgroup/fixed-sticky
     *
     * The MIT License (MIT)
     *
     * Copyright (c) 2013 Filament Group
     */


    function _updateSticky(el) {
      if (!el.offsetWidth) {
        return;
      }

      var $el = $(el);
      var height = $el.outerHeight();
      var position = $el.data('sticky-position'); // Viewport height.

      var viewport_height = $(editor.opts.scrollableContainer === 'body' ? editor.o_win : editor.opts.scrollableContainer).outerHeight();
      var scrollable_top = 0;
      var scrollable_bottom = 0;

      if (editor.opts.scrollableContainer !== 'body') {
        scrollable_top = editor.$sc.offset().top;
        scrollable_bottom = $(editor.o_win).outerHeight() - scrollable_top - viewport_height;
      }

      var offset_top = editor.opts.scrollableContainer === 'body' ? editor.helpers.scrollTop() : scrollable_top;
      var is_on = $el.is('.fr-sticky-on'); // Decide parent.

      if (!$el.data('sticky-parent')) {
        $el.data('sticky-parent', $el.parent());
      }

      var $parent = $el.data('sticky-parent');
      var parent_top = $parent.offset().top;
      var parent_height = $parent.outerHeight();

      if (!$el.data('sticky-offset')) {
        $el.data('sticky-offset', true);
        $el.after("<div class=\"fr-sticky-dummy\" style=\"height: ".concat(height, "px;\"></div>"));
      } else {
        editor.$box.find('.fr-sticky-dummy').css('height', "".concat(height, "px"));
      } // Detect position placement.


      if (!position) {
        // Some browsers require fixed/absolute to report accurate top/left values.
        var skip_setting_fixed = $el.css('top') !== 'auto' || $el.css('bottom') !== 'auto'; // Set to position fixed for a split of second.

        if (!skip_setting_fixed) {
          $el.css('position', 'fixed');
        } // Find position.


        position = {
          top: editor.node.hasClass($el.get(0), 'fr-top'),
          bottom: editor.node.hasClass($el.get(0), 'fr-bottom') // Remove position fixed.

        };

        if (!skip_setting_fixed) {
          $el.css('position', '');
        } // Store position.


        $el.data('sticky-position', position);
        $el.data('top', editor.node.hasClass($el.get(0), 'fr-top') ? $el.css('top') : 'auto');
        $el.data('bottom', editor.node.hasClass($el.get(0), 'fr-bottom') ? $el.css('bottom') : 'auto');
      }

      var el_top = editor.helpers.getPX($el.data('top'));
      var el_bottom = editor.helpers.getPX($el.data('bottom')); // Detect if is OK to fix at the top.

      function isFixedToTop() {
        // 1. Top condition.
        // 2. Bottom condition.
        return parent_top < offset_top + el_top && parent_top + parent_height - height >= offset_top + el_top;
      } // Detect if it is OK to fix at the bottom.


      function isFixedToBottom() {
        return parent_top + height < offset_top + viewport_height - el_bottom && parent_top + parent_height > offset_top + viewport_height - el_bottom;
      }

      var at_top = position.top && isFixedToTop() && (editor.helpers.isInViewPort(editor.$sc.get(0)) || editor.opts.scrollableContainer === 'body');
      var at_bottom = position.bottom && isFixedToBottom(); // Should be fixed.

      if (at_top || at_bottom) {
        // Account for parent border in calculating toolbar width
        var parentBorderWidth = $parent.get(0).offsetWidth - $parent.get(0).clientWidth;
        $el.css('width', "".concat($parent.get(0).getBoundingClientRect().width - parentBorderWidth, "px"));

        if (!is_on) {
          $el.addClass('fr-sticky-on');
          $el.removeClass('fr-sticky-off');

          if ($el.css('top')) {
            if ($el.data('top') !== 'auto') {
              $el.css('top', editor.helpers.getPX($el.data('top')) + scrollable_top);
            } else {
              $el.data('top', 'auto');
            }
          }

          if ($el.css('bottom')) {
            if ($el.data('bottom') !== 'auto') {
              $el.css('bottom', editor.helpers.getPX($el.data('bottom')) + scrollable_bottom);
            } else {
              $el.css('bottom', 'auto');
            }
          }
        }
      } // Shouldn't be fixed.
      else if (!editor.node.hasClass($el.get(0), 'fr-sticky-off')) {
          // Reset.
          $el.css('width', '');
          $el.removeClass('fr-sticky-on');
          $el.addClass('fr-sticky-off');

          if ($el.css('top') && $el.data('top') !== 'auto' && position.top) {
            $el.css('top', 0);
          }

          if ($el.css('bottom') && $el.data('bottom') !== 'auto' && position.bottom) {
            $el.css('bottom', 0);
          }
        }
    }
    /**
     * Test if browser supports sticky.
     */


    function _testSticky() {
      return false;
    } // Use an animation frame to make sure we're always OK with the updates.


    function animate() {
      editor.helpers.requestAnimationFrame()(animate);

      if (editor.events.trigger('position.refresh') === false) {
        return;
      }

      for (var i = 0; i < editor._stickyElements.length; i++) {
        _updateIOSSticky(editor._stickyElements[i]);
      }
    }
    /**
     * Initialize sticky position.
     */


    function _initSticky() {
      if (!_testSticky()) {
        editor._stickyElements = []; // iOS special case.

        if (editor.helpers.isIOS()) {
          animate(); // Hide toolbar on touchmove. This is very useful on iOS versions < 8.

          editor.events.$on($(editor.o_win), 'scroll', function () {
            if (editor.core.hasFocus()) {
              for (var i = 0; i < editor._stickyElements.length; i++) {
                var $el = $(editor._stickyElements[i]);
                var $parent = $el.parent();
                var c_scroll = editor.helpers.scrollTop();

                if ($el.outerHeight() < c_scroll - $parent.offset().top) {
                  $el.addClass('fr-opacity-0');
                  $el.data('sticky-top', -1);
                  $el.data('sticky-scheduled', -1);
                }
              }
            }
          }, true);
        } // Default case. Do the updates on scroll.
        else {
            if (editor.opts.scrollableContainer !== 'body') {
              editor.events.$on($(editor.opts.scrollableContainer), 'scroll', refresh, true);
            }

            editor.events.$on($(editor.o_win), 'scroll', refresh, true);
            editor.events.$on($(editor.o_win), 'resize', refresh, true);
            editor.events.on('initialized', refresh);
            editor.events.on('focus', refresh);
            editor.events.$on($(editor.o_win), 'resize', 'textarea', refresh, true);
          }
      }

      editor.events.on('destroy', function () {
        editor._stickyElements = [];
      });
    }

    function refresh() {
      if (editor._stickyElements) {
        for (var i = 0; i < editor._stickyElements.length; i++) {
          _updateSticky(editor._stickyElements[i]);
        }
      }
    }
    /**
     * Mark element as sticky.
     */


    function addSticky($el) {
      $el.addClass('fr-sticky');

      if (editor.helpers.isIOS()) {
        $el.addClass('fr-sticky-ios');
      }

      if (!_testSticky()) {
        $el.removeClass('fr-sticky');

        editor._stickyElements.push($el.get(0));
      }
    }

    function _init() {
      _initSticky();
    }

    return {
      _init: _init,
      forSelection: forSelection,
      addSticky: addSticky,
      refresh: refresh,
      at: at,
      getBoundingRect: getBoundingRect
    };
  };

  FroalaEditor.MODULES.refresh = function (editor) {
    var $ = editor.$;

    function undo($btn) {
      _setDisabled($btn, !editor.undo.canDo());
    }

    function redo($btn) {
      _setDisabled($btn, !editor.undo.canRedo());
    }

    function indent($btn) {
      if (editor.node.hasClass($btn.get(0), 'fr-no-refresh')) {
        return false;
      }

      var blocks = editor.selection.blocks();

      for (var i = 0; i < blocks.length; i++) {
        var p_node = blocks[i].previousSibling;

        while (p_node && p_node.nodeType === Node.TEXT_NODE && p_node.textContent.length === 0) {
          p_node = p_node.previousSibling;
        }

        if (blocks[i].tagName === 'LI' && !p_node) {
          _setDisabled($btn, true);
        } else {
          _setDisabled($btn, false);

          return true;
        }
      }
    }

    function outdent($btn) {
      if (editor.node.hasClass($btn.get(0), 'fr-no-refresh')) {
        return false;
      }

      var blocks = editor.selection.blocks();

      for (var i = 0; i < blocks.length; i++) {
        var prop = editor.opts.direction === 'rtl' || $(blocks[i]).css('direction') === 'rtl' ? 'margin-right' : 'margin-left';

        if (blocks[i].tagName === 'LI' || blocks[i].parentNode.tagName === 'LI') {
          _setDisabled($btn, false);

          return true;
        }

        if (editor.helpers.getPX($(blocks[i]).css(prop)) > 0) {
          _setDisabled($btn, false);

          return true;
        }
      }

      _setDisabled($btn, true);
    }
    /**
     * Disable/enable buton.
     */


    function _setDisabled($btn, disabled) {
      $btn.toggleClass('fr-disabled', disabled).attr('aria-disabled', disabled);
    }
    /**
     * Apply styles to button groups
     */


    function more($moreButton) {
      // Align the hidden toolbar with respect to its corresponding more button
      // Set its width to cover the complete editor width
      var $moreToolbar = editor.$tb.find(".fr-more-toolbar[data-name=\"".concat($moreButton.attr('data-group-name'), "\"]"));

      var offset = _computeMoreToolbarPosition($moreButton, $moreToolbar); // Position hidden toolbar w.r.t. more button


      if (editor.opts.direction === 'rtl') {
        $moreToolbar.css('padding-right', offset);
      } else {
        $moreToolbar.css('padding-left', offset);
      }
    }
    /**
     * Compute more toolbar new position w.r.t more button
     */


    function _computeMoreToolbarPosition($moreButton, $moreToolbar) {
      // Compute total buttons width in the more toolbar
      var totalButtonWidth = 0;
      var $moreToolbarBtns = $moreToolbar.find('> .fr-command, > .fr-btn-wrap');
      $moreToolbarBtns.each(function (index, btn) {
        totalButtonWidth += $(btn).outerWidth();
      }); // Calculate the position to place the hidden toolbar w.r.t. its more button

      var buttonMarginLeft = editor.helpers.getPX($($moreToolbarBtns[0]).css('margin-left'));
      var buttonMarginRight = editor.helpers.getPX($($moreToolbarBtns[0]).css('margin-right'));
      var offset;

      if (editor.opts.direction === 'rtl') {
        offset = editor.$tb.outerWidth() - $moreButton.offset().left + editor.$tb.offset().left - (totalButtonWidth + $moreButton.outerWidth() + $moreToolbarBtns.length * (buttonMarginLeft + buttonMarginRight)) / 2;
      } else {
        offset = $moreButton.offset().left - editor.$tb.offset().left - (totalButtonWidth - $moreButton.outerWidth() + $moreToolbarBtns.length * (buttonMarginLeft + buttonMarginRight)) / 2;
      } // Handle right side going outside the editor


      if (offset + totalButtonWidth + $moreToolbarBtns.length * (buttonMarginLeft + buttonMarginRight) > editor.$tb.outerWidth()) {
        offset -= (totalButtonWidth + $moreToolbarBtns.length * (buttonMarginLeft + buttonMarginRight) - $moreButton.outerWidth()) / 2;
      } // Handle left side going outside the editor


      if (offset < 0) {
        offset = 0;
      }

      return offset;
    }

    return {
      undo: undo,
      redo: redo,
      outdent: outdent,
      indent: indent,
      moreText: more,
      moreParagraph: more,
      moreMisc: more,
      moreRich: more
    };
  };

  Object.assign(FroalaEditor.DEFAULTS, {
    attribution: true,
    toolbarBottom: false,
    toolbarButtons: null,
    toolbarButtonsXS: null,
    toolbarButtonsSM: null,
    toolbarButtonsMD: null,
    toolbarContainer: null,
    toolbarInline: false,
    toolbarSticky: true,
    toolbarStickyOffset: 0,
    toolbarVisibleWithoutSelection: false
  }); // Default toolbar buttons.

  FroalaEditor.TOOLBAR_BUTTONS = {
    'moreText': {
      'buttons': ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', 'textColor', 'backgroundColor', 'inlineClass', 'inlineStyle', 'clearFormatting']
    },
    'moreParagraph': {
      'buttons': ['alignLeft', 'alignCenter', 'formatOLSimple', 'alignRight', 'alignJustify', 'formatOL', 'formatUL', 'paragraphFormat', 'paragraphStyle', 'lineHeight', 'outdent', 'indent', 'quote']
    },
    'moreRich': {
      'buttons': ['insertLink', 'insertImage', 'insertVideo', 'insertTable', 'emoticons', 'fontAwesome', 'specialCharacters', 'embedly', 'insertFile', 'insertHR']
    },
    'moreMisc': {
      'buttons': ['undo', 'redo', 'fullscreen', 'print', 'getPDF', 'spellChecker', 'selectAll', 'html', 'help'],
      'align': 'right',
      'buttonsVisible': 2
    }
  };
  FroalaEditor.TOOLBAR_BUTTONS_MD = null;
  FroalaEditor.TOOLBAR_BUTTONS_SM = {};
  FroalaEditor.TOOLBAR_BUTTONS_SM.moreText = Object.assign({}, FroalaEditor.TOOLBAR_BUTTONS.moreText, {
    'buttonsVisible': 2
  });
  FroalaEditor.TOOLBAR_BUTTONS_SM.moreParagraph = Object.assign({}, FroalaEditor.TOOLBAR_BUTTONS.moreParagraph, {
    'buttonsVisible': 2
  });
  FroalaEditor.TOOLBAR_BUTTONS_SM.moreRich = Object.assign({}, FroalaEditor.TOOLBAR_BUTTONS.moreRich, {
    'buttonsVisible': 2
  });
  FroalaEditor.TOOLBAR_BUTTONS_SM.moreMisc = Object.assign({}, FroalaEditor.TOOLBAR_BUTTONS.moreMisc, {
    'buttonsVisible': 2
  });
  FroalaEditor.TOOLBAR_BUTTONS_XS = {};
  FroalaEditor.TOOLBAR_BUTTONS_XS.moreText = Object.assign({}, FroalaEditor.TOOLBAR_BUTTONS.moreText, {
    'buttonsVisible': 0
  });
  FroalaEditor.TOOLBAR_BUTTONS_XS.moreParagraph = Object.assign({}, FroalaEditor.TOOLBAR_BUTTONS.moreParagraph, {
    'buttonsVisible': 0
  });
  FroalaEditor.TOOLBAR_BUTTONS_XS.moreRich = Object.assign({}, FroalaEditor.TOOLBAR_BUTTONS.moreRich, {
    'buttonsVisible': 0
  });
  FroalaEditor.TOOLBAR_BUTTONS_XS.moreMisc = Object.assign({}, FroalaEditor.TOOLBAR_BUTTONS.moreMisc, {
    'buttonsVisible': 2
  });
  FroalaEditor.POWERED_BY = '<a id="logo" href="https://froala.com/wysiwyg-editor" target="_blank" title="Froala WYSIWYG HTML Editor"><span>Powered by</span><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 822.8 355.33"><defs><style>.fr-logo{fill:#b1b2b7;}</style></defs><title>Froala</title><path class="fr-logo" d="M123.58,78.65A16.16,16.16,0,0,0,111.13,73H16.6C7.6,73,0,80.78,0,89.94V128.3a16.45,16.45,0,0,0,32.9,0V104.14h78.5A15.63,15.63,0,0,0,126.87,91.2,15.14,15.14,0,0,0,123.58,78.65Z"/><path class="fr-logo" d="M103.54,170a16.05,16.05,0,0,0-11.44-4.85H15.79A15.81,15.81,0,0,0,0,180.93v88.69a16.88,16.88,0,0,0,5,11.92,16,16,0,0,0,11.35,4.7h.17a16.45,16.45,0,0,0,16.41-16.6v-73.4H92.2A15.61,15.61,0,0,0,107.89,181,15.1,15.1,0,0,0,103.54,170Z"/><path class="fr-logo" d="M233,144.17c-5.29-6.22-16-7.52-24.14-7.52-16.68,0-28.72,7.71-36.5,23.47v-5.67a16.15,16.15,0,1,0-32.3,0v115.5a16.15,16.15,0,1,0,32.3,0v-38.7c0-19.09,3.5-63.5,35.9-63.5a44.73,44.73,0,0,1,5.95.27h.12c12.79,1.2,20.06-2.73,21.6-11.69C236.76,151.48,235.78,147.39,233,144.17Z"/><path class="fr-logo" d="M371.83,157c-13.93-13.11-32.9-20.33-53.43-20.33S279,143.86,265.12,157c-14.67,13.88-22.42,32.82-22.42,54.77,0,21.68,8,41.28,22.4,55.2,13.92,13.41,32.85,20.8,53.3,20.8s39.44-7.38,53.44-20.79c14.55-13.94,22.56-33.54,22.56-55.21S386.39,170.67,371.83,157Zm-9.73,54.77c0,25.84-18.38,44.6-43.7,44.6s-43.7-18.76-43.7-44.6c0-25.15,18.38-43.4,43.7-43.4S362.1,186.59,362.1,211.74Z"/><path class="fr-logo" d="M552.7,138.14a16.17,16.17,0,0,0-16,16.3v1C526.41,143.85,509,136.64,490,136.64c-19.83,0-38.19,7.24-51.69,20.4C424,171,416.4,190,416.4,212c0,21.61,7.78,41.16,21.9,55,13.56,13.33,31.92,20.67,51.7,20.67,18.83,0,36.29-7.41,46.7-19.37v1.57a16.15,16.15,0,1,0,32.3,0V154.44A16.32,16.32,0,0,0,552.7,138.14Zm-16.3,73.6c0,30.44-22.81,44.3-44,44.3-24.57,0-43.1-19-43.1-44.3s18.13-43.4,43.1-43.4C513.73,168.34,536.4,183.55,536.4,211.74Z"/><path class="fr-logo" d="M623.5,61.94a16.17,16.17,0,0,0-16,16.3v191.7a16.15,16.15,0,1,0,32.3,0V78.24A16.32,16.32,0,0,0,623.5,61.94Z"/><path class="fr-logo" d="M806.5,138.14a16.17,16.17,0,0,0-16,16.3v1c-10.29-11.63-27.74-18.84-46.7-18.84-19.83,0-38.19,7.24-51.69,20.4-14.33,14-21.91,33-21.91,55,0,21.61,7.78,41.16,21.9,55,13.56,13.33,31.92,20.67,51.7,20.67,18.83,0,36.29-7.41,46.7-19.37v1.57a16.15,16.15,0,1,0,32.3,0V154.44A16.32,16.32,0,0,0,806.5,138.14Zm-16.3,73.6c0,30.44-22.81,44.3-44,44.3-24.57,0-43.1-19-43.1-44.3s18.13-43.4,43.1-43.4C767.53,168.34,790.2,183.55,790.2,211.74Z"/></svg></a>';

  FroalaEditor.MODULES.toolbar = function (editor) {
    var $ = editor.$; // Create a button map for each screen size.

    var _buttons_map = [];
    _buttons_map[FroalaEditor.XS] = _normalizeButtons(editor.opts.toolbarButtonsXS || editor.opts.toolbarButtons || FroalaEditor.TOOLBAR_BUTTONS_XS || FroalaEditor.TOOLBAR_BUTTONS || []);
    _buttons_map[FroalaEditor.SM] = _normalizeButtons(editor.opts.toolbarButtonsSM || editor.opts.toolbarButtons || FroalaEditor.TOOLBAR_BUTTONS_SM || FroalaEditor.TOOLBAR_BUTTONS || []);
    _buttons_map[FroalaEditor.MD] = _normalizeButtons(editor.opts.toolbarButtonsMD || editor.opts.toolbarButtons || FroalaEditor.TOOLBAR_BUTTONS_MD || FroalaEditor.TOOLBAR_BUTTONS || []);
    _buttons_map[FroalaEditor.LG] = _normalizeButtons(editor.opts.toolbarButtons || FroalaEditor.TOOLBAR_BUTTONS || []); // Store previous screen size for resizing optimization

    var previousScreenSize;
    /**
     * Normalize buttons for regular structure.
     */

    function _normalizeButtons(buttons) {
      // All this method should do is to change the structure of the _buttons_map to be inline with the specs for buttons in V3.
      // Buttons is an array
      var buttonGroups = {};

      if (Array.isArray(buttons)) {
        // Convert from old button list to new button list
        if (!Array.isArray(buttons[0])) {
          var toolbarButtonGroups = [];
          var currentButtonGroup = [];

          for (var i = 0; i < buttons.length; i++) {
            // If the value is of type separator then add the currentButtonGroup to the toolbarButtonGroups
            // Re-initialize the currentButtonGroup for new group
            if (buttons[i] === '|' || buttons[i] === '-') {
              if (currentButtonGroup.length > 0) {
                toolbarButtonGroups.push(currentButtonGroup);
              }

              currentButtonGroup = [];
            } // Otherwise add the button to the currentButtonGroup
            else {
                currentButtonGroup.push(buttons[i]);
              }
          } // If there are buttons in the currentButtonGroup then add the group to the toolbar button groups


          if (currentButtonGroup.length > 0) {
            toolbarButtonGroups.push(currentButtonGroup);
          }

          buttons = toolbarButtonGroups;
        } // Create a button group object from button group array


        buttons.forEach(function (button, index) {
          buttonGroups["group".concat(index + 1)] = {
            buttons: button
          };
        }); // Don't show more buttons when input buttons is a list

        buttonGroups.showMoreButtons = false;
      } // Button is an Object with group name and buttons info
      else if (_typeof(buttons) === 'object' && !Array.isArray(buttons)) {
          buttonGroups = buttons; // Show more buttons when input is more button groups

          buttonGroups.showMoreButtons = true;
        }

      return buttonGroups;
    }
    /**
     * Add buttons to the toolbar.
     */


    function _addButtons() {
      var buttons_list = editor.button.buildGroup(_screenButtons());
      editor.$tb.append(buttons_list); // Set the height of all more toolbars

      setMoreToolbarsHeight();
      editor.button.bindCommands(editor.$tb);
    }
    /**
     * The buttons that should be visible on the current screen size.
     */


    function _screenButtons() {
      var screen_size = editor.helpers.screenSize(); // Update previous screen size

      previousScreenSize = screen_size;
      return _buttons_map[screen_size];
    }
    /**
     * Remove button group wrappers
     */


    function _removeButtonGroupWrappers() {
      // Remove all wrapper button groups
      var $buttonGroups = editor.$tb.find('.fr-btn-grp, .fr-more-toolbar');

      var _loop = function _loop(index) {
        // Remove parent wrapper
        var $buttonGroup = $($buttonGroups[index]);
        $buttonGroup.children().each(function (index, $btn) {
          $buttonGroup.before($btn);
        });
        $buttonGroup.remove();
      };

      for (var index = 0; index < $buttonGroups.length; index++) {
        _loop(index);
      }
    }
    /**
     * Sets the more toolbar height
     */


    function setMoreToolbarsHeight() {
      var $moreToolbars = editor.$tb.find('.fr-more-toolbar');
      var toolbarPaddingBottom = '';

      for (var i = 0; i < $moreToolbars.length; i++) {
        var $moreToolbar = $($moreToolbars[i]); // Do only if more toolbar is expanded

        if ($moreToolbar.hasClass('fr-expanded')) {
          (function () {
            // More toolbar left padding
            var moreToolbarWidth = editor.helpers.getPX($moreToolbar.css('padding-left')); // Get all more toolbar buttons

            var $moreToolbarBtns = $moreToolbar.find('> .fr-command, > .fr-btn-wrap');
            var $moreToolbarBtn = $($moreToolbarBtns[0]); // Compute button margins if any

            var buttonMarginLeft = editor.helpers.getPX($moreToolbarBtn.css('margin-left'));
            var buttonMarginRight = editor.helpers.getPX($moreToolbarBtn.css('margin-right'));
            var buttonMarginTop = editor.helpers.getPX($moreToolbarBtn.css('margin-top'));
            var buttonMarginBottom = editor.helpers.getPX($moreToolbarBtn.css('margin-bottom')); // Compute more toolbar content width

            $moreToolbarBtns.each(function (index, btn) {
              moreToolbarWidth += $(btn).outerWidth() + buttonMarginLeft + buttonMarginRight;
            }); // Compute complete toolbar width

            var toolbarWidth = editor.$tb.outerWidth(); // If all the more toolbar buttons can't be accomodated in one row

            if (moreToolbarWidth > toolbarWidth) {
              // Compute no of rows required to accomodate all more toolbar buttons
              var moreToolbarRows = Math.floor(moreToolbarWidth / editor.$tb.outerWidth());
              moreToolbarWidth += moreToolbarRows * (moreToolbarWidth / $moreToolbar[0].childElementCount);
              moreToolbarRows = Math.ceil(moreToolbarWidth / editor.$tb.outerWidth()); // Set more toolbar height

              var moreToolbarHeight = (editor.helpers.getPX($moreToolbarBtn.css('height')) + buttonMarginTop + buttonMarginBottom) * moreToolbarRows;
              $moreToolbar.css('height', moreToolbarHeight);
              toolbarPaddingBottom = moreToolbarHeight;
            }
          })();
        } // Otherwise reset the properties
        else {
            $moreToolbar.css('height', '');
          }
      } // Shift the editor area by the new toolbar height


      editor.$tb.css('padding-bottom', toolbarPaddingBottom);
    }
    /**
     * Reorder the toolbar buttons on resize
     */


    function _showScreenButtons() {
      // Update the toolbar only if screen size is changed
      if (previousScreenSize !== editor.helpers.screenSize()) {
        // Get screen button groups
        var buttonGroups = _screenButtons(); // Toolbar groups


        var mainToolbarButtonGroups = $();
        var moreToolbarButtonGroups = $(); // Hide all buttons

        editor.$tb.find('.fr-btn-grp > .fr-command, .fr-more-toolbar > .fr-command, .fr-btn-grp > .fr-btn-wrap > .fr-command, .fr-more-toolbar > .fr-btn-wrap > .fr-command').addClass('fr-hidden'); // Remove wrapper div from button groups

        _removeButtonGroupWrappers();

        for (var groupName in buttonGroups) {
          // Current button group
          var buttonGroup = buttonGroups[groupName]; // Ignore non-button groups

          if (!buttonGroup.buttons) {
            continue;
          } // Current button group Details


          var moreToolbarButtons = void 0;
          var buttonCount = 0;
          var visibleButtons = 3;
          var mainToolbarButtons = $("<div class=\"fr-btn-grp fr-float-".concat(buttonGroups[groupName].align ? buttonGroups[groupName].align : 'left', "\"></div>"));

          if (buttonGroups.showMoreButtons) {
            moreToolbarButtons = $('<div class="fr-more-toolbar"></div>').data('name', "".concat(groupName, "-").concat(editor.id));
          }

          for (var i = 0; i < buttonGroup.buttons.length; i++) {
            // If buttonVisible is provided then use it
            if (buttonGroup.buttonsVisible !== undefined) {
              visibleButtons = buttonGroup.buttonsVisible;
            } // Get the button for the command


            var $btn = editor.$tb.find('> .fr-command[data-cmd="' + buttonGroup.buttons[i] + '"], > div.fr-btn-wrap > .fr-command[data-cmd="' + buttonGroup.buttons[i] + '"]');
            var $dropdown = null; // If it is a dropdown button

            if (editor.node.hasClass($btn.next().get(0), 'fr-dropdown-menu')) {
              $dropdown = $btn.next();
            } // If it is a button with options


            if (editor.node.hasClass($btn.next().get(0), 'fr-options')) {
              $btn.removeClass('fr-hidden');
              $btn.next().removeClass('fr-hidden');
              $btn = $btn.parent();
            } // Show the buttons in the toolbar


            $btn.removeClass('fr-hidden'); // Wrap the buttons in a button group

            if (buttonGroups.showMoreButtons && buttonCount >= visibleButtons) {
              moreToolbarButtons.append($btn);

              if ($dropdown) {
                moreToolbarButtons.append($dropdown);
              }
            } else {
              mainToolbarButtons.append($btn);

              if ($dropdown) {
                mainToolbarButtons.append($dropdown);
              }
            }

            buttonCount++;
          } // Add more button if buttons in group are more than 'buttonsVisible'


          if (buttonGroups.showMoreButtons && buttonCount > visibleButtons) {
            var $moreButton = editor.$tb.find(".fr-command[data-cmd=\"".concat(groupName, "\"]"));

            if ($moreButton.length > 0) {
              $moreButton.removeClass('fr-hidden fr-open');
            } else {
              // Create a new more button if not present already
              var cmdName = groupName;
              var cmdInfo = FroalaEditor.COMMANDS[cmdName];
              cmdInfo.more_btn = true;
              $moreButton = $(editor.button.build(cmdName, cmdInfo, true)); // Register the more button

              editor.button.addButtons($moreButton);
            }

            mainToolbarButtons.append($moreButton);
          } // Append visible buttons on the main toolbar


          mainToolbarButtonGroups.push(mainToolbarButtons); // Append more toolbar buttons

          if (buttonGroups.showMoreButtons) {
            moreToolbarButtonGroups.push(moreToolbarButtons);
          }
        } // Append button groups to the editor


        if (editor.opts.toolbarBottom) {
          editor.$tb.append(moreToolbarButtonGroups);
          editor.$tb.find('.fr-newline').remove();
          editor.$tb.append('<div class="fr-newline"></div>');
          editor.$tb.append(mainToolbarButtonGroups);
        } else {
          editor.$tb.append(mainToolbarButtonGroups);
          editor.$tb.find('.fr-newline').remove();
          editor.$tb.append('<div class="fr-newline"></div>');
          editor.$tb.append(moreToolbarButtonGroups);
        } // Close the more toolbar


        editor.$tb.removeClass('fr-toolbar-open');
        editor.$box.removeClass('fr-toolbar-open'); // Switch to normal view if in code view

        editor.events.trigger('codeView.toggle');
      } // Refresh more toolbar height on resize


      setMoreToolbarsHeight();
    }
    /**
     * Set the buttons visibility based on screen size.
     */


    function _setVisibility() {
      editor.events.$on($(editor.o_win), 'resize', _showScreenButtons);
      editor.events.$on($(editor.o_win), 'orientationchange', _showScreenButtons);
    }

    function showInline(e, force) {
      setTimeout(function () {
        // https://github.com/froala-labs/froala-editor-js-2/issues/1571
        // Condition added to avoid showing toolbar when the table has contenteditable:false
        if ((!e || e.which != FroalaEditor.KEYCODE.ESC) && editor.selection.inEditor() && editor.core.hasFocus() && !editor.popups.areVisible() && $(editor.selection.blocks()[0]).closest('table').attr('contenteditable') != 'false') {
          if (editor.opts.toolbarVisibleWithoutSelection || !editor.selection.isCollapsed() && !editor.keys.isIME() || force) {
            editor.$tb.data('instance', editor); // Check if we should actually show the toolbar.

            if (editor.events.trigger('toolbar.show', [e]) === false) {
              return;
            }

            editor.$tb.show();

            if (!editor.opts.toolbarContainer) {
              editor.position.forSelection(editor.$tb);
            }

            if (editor.opts.zIndex > 1) {
              editor.$tb.css('z-index', editor.opts.zIndex + 1);
            } else {
              editor.$tb.css('z-index', null);
            }
          }
        }
      }, 0);
    }

    function hide(e) {
      // Prevent hiding the editor toolbar when changing the window.
      if (e && e.type === 'blur' && document.activeElement === editor.el) {
        return false;
      } // Do not hide toolbar if we press CTRL.


      if (e && e.type === 'keydown' && editor.keys.ctrlKey(e)) {
        return true;
      } // Prevent hiding when dropdown is active and we scoll in it.
      // https://github.com/froala/wysiwyg-editor/issues/1290


      var $active_dropdowns = editor.button.getButtons('.fr-dropdown.fr-active');

      if ($active_dropdowns.next().find(editor.o_doc.activeElement).length) {
        return true;
      } // Check if we should actually hide the toolbar.


      if (editor.events.trigger('toolbar.hide') !== false) {
        editor.$tb.hide();
      }
    }

    function show() {
      // Check if we should actually hide the toolbar.
      if (editor.events.trigger('toolbar.show') === false) {
        return false;
      }

      editor.$tb.show();
    }

    var tm = null;

    function _showInlineWithTimeout(e) {
      clearTimeout(tm);

      if (!e || e.which !== FroalaEditor.KEYCODE.ESC) {
        tm = setTimeout(showInline, editor.opts.typingTimer);
      }
    }
    /**
     * Set the events for show / hide toolbar.
     */


    function _initInlineBehavior() {
      // Window mousedown.
      editor.events.on('window.mousedown', hide); // Element keydown.

      editor.events.on('keydown', hide); // Element blur.

      editor.events.on('blur', hide); // Position the toolbar after expanding the more toolbar completely if toolbar is inline

      editor.events.$on(editor.$tb, 'transitionend', '.fr-more-toolbar', function () {
        editor.position.forSelection(editor.$tb);
      }); // Window mousedown.

      if (!editor.helpers.isMobile()) {
        editor.events.on('window.mouseup', showInline);
      }

      if (editor.helpers.isMobile()) {
        if (!editor.helpers.isIOS()) {
          editor.events.on('window.touchend', showInline);

          if (editor.browser.mozilla) {
            setInterval(showInline, 200);
          }
        }
      } else {
        editor.events.on('window.keyup', _showInlineWithTimeout);
      } // Hide editor on ESC.


      editor.events.on('keydown', function (e) {
        if (e && e.which === FroalaEditor.KEYCODE.ESC) {
          hide();
        }
      }); // Enable accessibility shortcut.

      editor.events.on('keydown', function (e) {
        if (e.which === FroalaEditor.KEYCODE.ALT) {
          e.stopPropagation();
          return false;
        }
      }, true);
      editor.events.$on(editor.$wp, 'scroll.toolbar', showInline);
      editor.events.on('commands.after', showInline);

      if (editor.helpers.isMobile()) {
        editor.events.$on(editor.$doc, 'selectionchange', _showInlineWithTimeout);
        editor.events.$on(editor.$doc, 'orientationchange', showInline);
      }
    }

    function _initPositioning() {
      // Toolbar is inline.
      if (editor.opts.toolbarInline) {
        // Mobile should handle this as regular.
        editor.$sc.append(editor.$tb); // Add toolbar to body.

        editor.$tb.data('container', editor.$sc); // Add inline class.

        editor.$tb.addClass('fr-inline'); // Init mouse behavior.

        _initInlineBehavior();

        editor.opts.toolbarBottom = false;
      } // Toolbar is normal.
      else {
          // Won't work on iOS.
          if (editor.opts.toolbarBottom && !editor.helpers.isIOS()) {
            editor.$box.append(editor.$tb);
            editor.$tb.addClass('fr-bottom');
            editor.$box.addClass('fr-bottom');
          } else {
            editor.opts.toolbarBottom = false;
            editor.$box.prepend(editor.$tb);
            editor.$tb.addClass('fr-top');
            editor.$box.addClass('fr-top');
          }

          editor.$tb.addClass('fr-basic');

          if (editor.opts.toolbarSticky) {
            if (editor.opts.toolbarStickyOffset) {
              if (editor.opts.toolbarBottom) {
                editor.$tb.css('bottom', editor.opts.toolbarStickyOffset);
              } else {
                editor.$tb.css('top', editor.opts.toolbarStickyOffset);
              }
            }

            editor.position.addSticky(editor.$tb);
          }
        }
    }
    /**
     * Destroy.
     */


    function _sharedDestroy() {
      editor.$tb.html('').removeData().remove();
      editor.$tb = null;

      if (editor.$second_tb) {
        editor.$second_tb.html('').removeData().remove();
        editor.$second_tb = null;
      }
    }

    function _destroy() {
      editor.$box.removeClass('fr-top fr-bottom fr-inline fr-basic');
      editor.$box.find('.fr-sticky-dummy').remove();
    }

    function _setDefaults() {
      if (editor.opts.theme) {
        editor.$tb.addClass("".concat(editor.opts.theme, "-theme"));
      }

      if (editor.opts.zIndex > 1) {
        editor.$tb.css('z-index', editor.opts.zIndex + 1);
      } // Set direction.


      if (editor.opts.direction !== 'auto') {
        editor.$tb.removeClass('fr-ltr fr-rtl').addClass("fr-".concat(editor.opts.direction));
      } // Mark toolbar for desktop / mobile.


      if (!editor.helpers.isMobile()) {
        editor.$tb.addClass('fr-desktop');
      } else {
        editor.$tb.addClass('fr-mobile');
      } // Set the toolbar specific position inline / normal.


      if (!editor.opts.toolbarContainer) {
        _initPositioning();
      } else {
        if (editor.opts.toolbarInline) {
          _initInlineBehavior();

          hide();
        }

        if (editor.opts.toolbarBottom) {
          editor.$tb.addClass('fr-bottom');
        } else {
          editor.$tb.addClass('fr-top');
        }
      } // Add buttons to the toolbar.
      // Set their visibility for different screens.
      // Asses commands to the butttons.


      _addButtons();

      _setVisibility();

      editor.accessibility.registerToolbar(editor.$tb); // Make sure we don't trigger blur.

      editor.events.$on(editor.$tb, "".concat(editor._mousedown, " ").concat(editor._mouseup), function (e) {
        var originalTarget = e.originalEvent ? e.originalEvent.target || e.originalEvent.originalTarget : null;

        if (originalTarget && originalTarget.tagName !== 'INPUT' && !editor.edit.isDisabled()) {
          e.stopPropagation();
          e.preventDefault();
          return false;
        }
      }, true); // https://github.com/froala-labs/froala-editor-js-2/issues/1972

      if (editor.helpers.isMobile()) {
        editor.events.$on(editor.$tb, 'click', function () {
          editor.$el.focus();
        });
      } // Refresh the screen size if in fullscreen mode after the more toolbar expands completely


      editor.events.$on(editor.$tb, 'transitionend', '.fr-more-toolbar', function () {
        if (editor.$box.hasClass('fr-fullscreen')) {
          editor.opts.height = editor.o_win.innerHeight - (editor.opts.toolbarInline ? 0 : editor.$tb.outerHeight() + (editor.$second_tb ? editor.$second_tb.outerHeight() : 0));
          editor.size.refresh();
        }
      });
    }
    /**
     * Initialize
     */


    function _init() {
      editor.$sc = $(editor.opts.scrollableContainer).first();

      if (!editor.$wp) {
        return false;
      } // Add second toolbar


      if (!editor.opts.toolbarInline && !editor.opts.toolbarBottom) {
        editor.$second_tb = $(editor.doc.createElement('div')).attr('class', 'second-toolbar');
        editor.$box.append(editor.$second_tb); // Add powered by attribution.

        if (!(editor.ul === false && !editor.opts.attribution)) {
          editor.$second_tb.prepend(FroalaEditor.POWERED_BY);
        }
      } // Container for toolbar.


      if (editor.opts.toolbarContainer) {
        // Shared toolbar.
        if (!editor.shared.$tb) {
          editor.shared.$tb = $(editor.doc.createElement('DIV'));
          editor.shared.$tb.addClass('fr-toolbar');
          editor.$tb = editor.shared.$tb;
          $(editor.opts.toolbarContainer).append(editor.$tb);

          _setDefaults();

          editor.$tb.data('instance', editor);
        } else {
          editor.$tb = editor.shared.$tb;

          if (editor.opts.toolbarInline) {
            _initInlineBehavior();
          }
        }

        if (editor.opts.toolbarInline) {
          // Update box.
          editor.$box.addClass('fr-inline');
        } else {
          editor.$box.addClass('fr-basic');
        } // On focus set the current instance.


        editor.events.on('focus', function () {
          editor.$tb.data('instance', editor);
        }, true);
        editor.opts.toolbarInline = false;
      } else if (editor.opts.toolbarInline) {
        // Update box.
        editor.$box.addClass('fr-inline'); // Check for shared toolbar.

        if (!editor.shared.$tb) {
          editor.shared.$tb = $(editor.doc.createElement('DIV'));
          editor.shared.$tb.addClass('fr-toolbar');
          editor.$tb = editor.shared.$tb;

          _setDefaults();
        } else {
          editor.$tb = editor.shared.$tb; // Init mouse behavior.

          _initInlineBehavior();
        }
      } else {
        editor.$box.addClass('fr-basic');
        editor.$tb = $(editor.doc.createElement('DIV'));
        editor.$tb.addClass('fr-toolbar');

        _setDefaults();

        editor.$tb.data('instance', editor);
      } // Destroy.


      editor.events.on('destroy', _destroy, true);
      editor.events.on(!editor.opts.toolbarInline && !editor.opts.toolbarContainer ? 'destroy' : 'shared.destroy', _sharedDestroy, true); // Bind edit on /off events.

      editor.events.on('edit.on', function () {
        editor.$tb.removeClass('fr-disabled').removeAttr('aria-disabled');
      });
      editor.events.on('edit.off', function () {
        editor.$tb.addClass('fr-disabled').attr('aria-disabled', true);
      });

      _initShortcuts();
    }

    function _initShortcuts() {
      editor.events.on('shortcut', function (e, cmd, val) {
        // Search for button.
        var $btn;

        if (cmd && !val) {
          $btn = editor.$tb.find(".fr-command[data-cmd=\"".concat(cmd, "\"]"));
        } else if (cmd && val) {
          $btn = editor.$tb.find(".fr-command[data-cmd=\"".concat(cmd, "\"][data-param1=\"").concat(val, "\"]"));
        } // Button found.


        if ($btn.length) {
          e.preventDefault();
          e.stopPropagation();
          $btn.parents('.fr-toolbar').data('instance', editor);

          if (e.type === 'keydown') {
            editor.button.exec($btn);
            return false;
          }
        }
      });
    }

    var disabled = false;

    function disable() {
      if (!disabled && editor.$tb) {
        // Toolbar Button is two level down from toolbar div
        editor.$tb.find('.fr-btn-grp > .fr-command, .fr-more-toolbar > .fr-command').addClass('fr-disabled fr-no-refresh').attr('aria-disabled', true);
        disabled = true;
      }
    }

    function enable() {
      if (disabled && editor.$tb) {
        // Toolbar Button is two level down from toolbar div
        editor.$tb.find('.fr-btn-grp > .fr-command, .fr-more-toolbar > .fr-command').removeClass('fr-disabled fr-no-refresh').attr('aria-disabled', false);
        disabled = false;
      }

      editor.button.bulkRefresh();
    }

    return {
      _init: _init,
      hide: hide,
      show: show,
      showInline: showInline,
      disable: disable,
      enable: enable,
      setMoreToolbarsHeight: setMoreToolbarsHeight
    };
  };

  var passiveEvents = ['scroll', 'wheel', 'touchmove', 'touchstart', 'touchend']; // All possible prefixes of an event

  var eventPrefixes = ['webkit', 'moz', 'ms', 'o']; // Events which are browser dependent

  var irregularEvents = ['transitionend']; // List of all styles

  var stylesList = document.createElement('div').style; // All possible prefixes of a css property

  var cssPrefixes = ['Webkit', 'Moz', 'ms', 'O', 'css', 'style']; // Properties to be applied to get correct element styles

  var cssShow = {
    visibility: 'hidden',
    display: 'block' // Special Events

  };
  var specialEvents = ['focus', 'blur', 'click']; // Map to cache computed correct style names

  var correctStyleName = {};

  var _getEvent = function _getEvent(e, target) {
    return {
      altKey: e.altKey,
      bubbles: e.bubbles,
      cancelable: e.cancelable,
      changedTouches: e.changedTouches,
      ctrlKey: e.ctrlKey,
      detail: e.detail,
      eventPhase: e.eventPhase,
      metaKey: e.metaKey,
      pageX: e.pageX,
      pageY: e.pageY,
      shiftKey: e.shiftKey,
      view: e.view,
      'char': e["char"],
      key: e.key,
      keyCode: e.keyCode,
      button: e.button,
      buttons: e.buttons,
      clientX: e.clientX,
      clientY: e.clientY,
      offsetX: e.offsetX,
      offsetY: e.offsetY,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      screenX: e.screenX,
      screenY: e.screenY,
      targetTouches: e.targetTouches,
      toElement: e.toElement,
      touches: e.touches,
      type: e.type,
      which: e.which,
      target: e.target,
      currentTarget: target,
      originalEvent: e,
      stopPropagation: function stopPropagation() {
        e.stopPropagation();
      },
      stopImmediatePropagation: function stopImmediatePropagation() {
        e.stopImmediatePropagation();
      },
      preventDefault: function preventDefault() {
        if (passiveEvents.indexOf(e.type) === -1) {
          e.preventDefault();
        }
      }
    };
  };

  var isPartOfDOM = function isPartOfDOM(target) {
    return target.ownerDocument && target.ownerDocument.body.contains(target) || target.nodeName === '#document' || target.nodeName === 'HTML' || target === window;
  };

  var _getDelegator = function _getDelegator(fn, selector) {
    return function (e) {
      // Get the element the event was raised by.
      var target = e.target; // Loop parents.

      if (selector) {
        selector = _normalizeSelector(selector);

        while (target && target !== this) {
          // Check if the current target matches
          if (target.matches && target.matches(_normalizeSelector(selector))) {
            fn.call(target, _getEvent(e, target));
          }

          target = target.parentNode;
        }
      } else {
        if (isPartOfDOM(target)) {
          fn.call(target, _getEvent(e, target));
        }
      }
    };
  };

  var jQuery = function jQuery(selector, context) {
    return new init(selector, context);
  };

  var _normalizeSelector = function _normalizeSelector(selector) {
    if (selector && typeof selector == 'string') {
      // Modified the regex to handle the spaces before '>'
      return selector.replace(/^\s*>/g, ':scope >').replace(/,\s*>/g, ', :scope >');
    }

    return selector;
  };

  var isFunction = function isFunction(obj) {
    // Support: Chrome <=57, Firefox <=52
    // In some browsers, typeof returns "function" for HTML <object> elements
    // (i.e., `typeof document.createElement( "object" ) === "function"`).
    // We don't want to classify *any* DOM node as a function.
    return typeof obj === 'function' && typeof obj.nodeType !== 'number';
  };

  var $ = jQuery;
  jQuery.fn = jQuery.prototype = {
    constructor: jQuery,
    // The default length of a jQuery object is 0
    length: 0,
    contains: function contains(obj) {
      if (!obj) return false;

      if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
          if (this.contains(obj[i]) && this != obj[i]) return true;
        }

        return false;
      }

      for (var _i = 0; _i < this.length; _i++) {
        var node = obj;

        while (node) {
          if (node == this[_i] || node[0] && node[0].isEqualNode(this[_i])) {
            return true;
          }

          node = node.parentNode;
        }
      }

      return false;
    },
    findVisible: function findVisible(selector) {
      var $els = this.find(selector);

      for (var i = $els.length - 1; i >= 0; i--) {
        if (!$($els[i]).isVisible()) {
          $els.splice(i, 1);
        }
      }

      return $els;
    },
    // Encode URL parameters
    formatParams: function formatParams(params) {
      var formattedParams = "".concat(Object.keys(params).map(function (key) {
        return "".concat(key, "=").concat(encodeURIComponent(params[key]));
      }).join('&'));
      return formattedParams ? formattedParams : '';
    },
    // Takes a request object for making http requests using XMLHttpRequest
    ajax: function ajax(request) {
      var xhr = new XMLHttpRequest();
      var data = this.formatParams(request.data); // Add request params to the URL for GET request 

      if (request.method.toUpperCase() === 'GET') {
        request.url = data ? request.url + '?' + data : request.url;
      } // Make it async.


      xhr.open(request.method, request.url, true); // Set with credentials.

      if (request.withCredentials) {
        xhr.withCredentials = true;
      } // Set with CORS


      if (request.crossDomain) {
        xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
      } // Set headers.


      for (var header in request.headers) {
        if (Object.prototype.hasOwnProperty.call(request.headers, header)) {
          xhr.setRequestHeader(header, request.headers[header]);
        }
      }

      if (!Object.prototype.hasOwnProperty.call(request.headers, 'Content-Type')) {
        // Set json data type
        if (request.dataType === 'json') {
          xhr.setRequestHeader('Content-Type', 'application/json');
        } else {
          //Set deafult Content-Type
          xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        }
      } // Set events.


      xhr.onload = function () {
        if (xhr.status == 200) {
          var _data = xhr.responseText;

          if (request.dataType === 'json') {
            _data = JSON.parse(_data);
          }

          request.done(_data, xhr.status, xhr);
        } else {
          request.fail(xhr);
        }
      }; // Send data.


      xhr.send(data);
    },
    // Get all previous siblings of an element
    prevAll: function prevAll() {
      var res = $();

      if (!this[0]) {
        return res;
      }

      var elem = this[0];

      while (elem && elem.previousSibling) {
        elem = elem.previousSibling;
        res.push(elem);
      }

      return res;
    },
    // Determine the position of an element within the set
    index: function index(elem) {
      // No argument, return index in parent
      if (!elem) {
        return this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
      } // Index in selector


      if (typeof elem === 'string') {
        return [].indexOf.call($(elem), this[0]);
      } // Locate the position of the desired element


      return [].indexOf.call(this, // If it receives a jQuery object, the first element is used
      elem.length ? elem[0] : elem);
    },
    isVisible: function isVisible() {
      if (!this[0]) {
        return false;
      }

      return !!(this[0].offsetWidth || this[0].offsetHeight || this[0].getClientRects().length);
    },
    toArray: function toArray() {
      return [].slice.call(this);
    },
    // Get the Nth element in the matched element set OR
    // Get the whole matched element set as a clean array
    get: function get(num) {
      // Return all the elements in a clean array
      if (num == null) {
        return [].slice.call(this);
      } // Return just the one element from the set


      return num < 0 ? this[num + this.length] : this[num];
    },
    // Take an array of elements and push it onto the stack
    // (returning the new matched element set)
    pushStack: function pushStack(elems) {
      // Build a new jQuery matched element set
      var ret = jQuery.merge(this.constructor(), elems); // Add the old object onto the stack (as a reference)

      ret.prevObject = this; // Return the newly-formed element set

      return ret;
    },
    wrapAll: function wrapAll(html) {
      var wrap;

      if (this[0]) {
        if (isFunction(html)) {
          html = html.call(this[0]);
        } // The elements to wrap the target around


        wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(true);

        if (this[0].parentNode) {
          wrap.insertBefore(this[0]);
        }

        wrap.map(function () {
          var elem = this;

          while (elem.firstElementChild) {
            elem = elem.firstElementChild;
          }

          return elem;
        }).append(this);
      }

      return this;
    },
    wrapInner: function wrapInner(wrapper) {
      if (typeof wrapper === 'string') {
        var wrapperProps = wrapper.split(' ');
        var i = 0; // Remove all empty props

        while (i < wrapperProps.length && wrapperProps[i].trim().length === 0) {
          i++;
        } // First non-empty property is the element itself


        if (i < wrapperProps.length) {
          // https://github.com/froala-labs/froala-editor-js-2/issues/1928
          if (wrapperProps[i].trim() === $(wrapper)[0].tagName) {
            wrapper = document.createElement(wrapperProps[i].trim());
          }

          i++;
        } // Make sure it is re-initialized


        if (typeof wrapper !== 'string') {
          // Add all wrapper attributes
          var $wrapper = $(wrapper);

          for (; i < wrapperProps.length; i++) {
            wrapperProps[i] = wrapperProps[i].trim();
            var attr = wrapperProps[i].split('=');
            $wrapper.attr(attr[0], attr[1].replace('"', ''));
          }
        }
      }

      while (!this[0].firstChild && this[0].firstChild !== wrapper) {
        wrapper.appendChild(this[0].firstChild);
      }
    },
    wrap: function wrap(html) {
      var htmlIsFunction = isFunction(html);
      return this.each(function (i) {
        $(this).wrapAll(htmlIsFunction ? html.call(this, i) : html);
      });
    },
    unwrap: function unwrap() {
      return this.parent().each(function () {
        if (!(this.nodeName && this.nodeName.toLowerCase() === name.toLowerCase())) {
          jQuery(this).replaceWith(this.childNodes);
        }
      });
    },
    grep: function grep(elems, callback, invert) {
      var callbackInverse,
          matches = [],
          i = 0,
          length = elems.length,
          callbackExpect = !invert; // Go through the array, only saving the items
      // that pass the validator function

      for (; i < length; i++) {
        callbackInverse = !callback(elems[i], i);

        if (callbackInverse !== callbackExpect) {
          matches.push(elems[i]);
        }
      }

      return matches;
    },
    map: function map(callback) {
      return this.pushStack(jQuery.map(this, function (elem, i) {
        return callback.call(elem, i, elem);
      }));
    },
    slice: function slice() {
      return this.pushStack([].slice.apply(this, arguments));
    },
    each: function each(fn) {
      if (this.length) {
        for (var i = 0; i < this.length; i++) {
          if (fn.call(this[i], i, this[i]) === false) {
            break;
          }
        }
      }

      return this;
    },
    first: function first() {
      return this.eq(0);
    },
    last: function last() {
      return this.eq(-1);
    },
    eq: function eq(i) {
      var len = this.length,
          j = +i + (i < 0 ? len : 0);
      return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
    },
    empty: function empty() {
      for (var i = 0; i < this.length; i++) {
        this[i].innerHTML = '';
      }
    },
    contents: function contents() {
      var ret = $();

      for (var i = 0; i < this.length; i++) {
        var cldrn = this[i].childNodes;

        for (var j = 0; j < cldrn.length; j++) {
          ret.push(cldrn[j]);
        }
      }

      return ret;
    },
    attr: function attr(name, val) {
      if (_typeof(name) === 'object') {
        for (var k in name) {
          if (Object.prototype.hasOwnProperty.call(name, k)) {
            if (name[k] !== null) {
              this.attr(k, name[k]);
            }
          }
        }

        return this;
      }

      if (typeof val !== 'undefined') {
        if (name === 'checked') {
          for (var i = 0; i < this.length; i++) {
            this[i].checked = val;
          }
        } else if (name === 'tagName') {
          for (var _i2 = 0; _i2 < this.length; _i2++) {
            this[_i2].tagName = val;
          }
        } else {
          for (var _i3 = 0; _i3 < this.length; _i3++) {
            this[_i3].setAttribute(name, val);
          }
        } // Chain.


        return this;
      } else {
        if (this.length === 0 || !(this[0].getAttribute || name === 'checked')) {
          return undefined;
        }

        if (name === 'checked') {
          return this[0].checked;
        } else if (name === 'tagName') {
          return this[0].tagName;
        }

        return this[0].getAttribute(name);
      }
    },
    removeAttr: function removeAttr(name) {
      for (var i = 0; i < this.length; i++) {
        if (this[i].removeAttribute) this[i].removeAttribute(name);
      }

      return this;
    },
    hide: function hide() {
      this.css('display', 'none');
      return this;
    },
    show: function show() {
      this.css('display', 'block');
      return this;
    },
    focus: function focus() {
      if (this.length) {
        this[0].focus();
      }

      return this;
    },
    blur: function blur() {
      if (this.length) {
        this[0].blur();
      }

      return this;
    },
    data: function data(name, val) {
      // Object.
      if (typeof val !== 'undefined') {
        for (var i = 0; i < this.length; i++) {
          this[i]['data-' + name] = val;

          if (_typeof(val) !== 'object' && typeof val !== 'function') {
            if (this[i].setAttribute) {
              this[i].setAttribute('data-' + name, val);
            }
          }
        } // Chain.


        return this;
      } else {
        if (typeof val !== 'undefined') {
          return this.attr('data-' + name, val);
        } else {
          if (this.length === 0) return undefined;

          for (var _i4 = 0; _i4 < this.length; _i4++) {
            var dt = this[_i4]['data-' + name];

            if (typeof dt === 'undefined' || dt === null) {
              if (this[_i4].getAttribute) {
                dt = this[_i4].getAttribute('data-' + name);
              }
            }

            if (typeof dt != 'undefined' && dt != null) {
              return dt;
            }
          }

          return undefined;
        }
      }
    },
    removeData: function removeData(name) {
      for (var i = 0; i < this.length; i++) {
        if (this[i].removeAttribute) this[i].removeAttribute('data-' + name);
        this[i]['data-' + name] = null;
      }

      return this;
    },
    getCorrectStyleName: function getCorrectStyleName(name) {
      // Compute only if not computed before
      if (!correctStyleName[name]) {
        var finalName; // If a style with same name exists then it is the original name

        if (name in stylesList) {
          finalName = name;
        } // Make first letter capital


        var capName = name[0].toUpperCase() + name.slice(1); // Try attaching the prefixes and checking if it is a valid style name

        var i = cssPrefixes.length;

        while (i--) {
          name = cssPrefixes[i] + capName;

          if (name in stylesList) {
            finalName = name;
          }
        } // Store for future use


        correctStyleName[name] = finalName;
      }

      return correctStyleName[name];
    },
    css: function css(name, val) {
      if (typeof val !== 'undefined') {
        if (this.length === 0) return this;

        if ((typeof val === 'string' && val.trim() !== '' && !isNaN(val) || typeof val === 'number') && /(margin)|(padding)|(height)|(width)|(top)|(left)|(right)|(bottom)/gi.test(name) && !/(line-height)/gi.test(name)) {
          val = val + 'px';
        }

        for (var i = 0; i < this.length; i++) {
          // Make sure the style name is correct
          name = $(this).getCorrectStyleName(name);
          this[i].style[name] = val;
        }

        return this;
      } else if (typeof name == 'string') {
        if (this.length === 0) return undefined;
        var doc = this[0].ownerDocument || document;
        var win = doc.defaultView || doc.parentWindow; // Make sure the style name is correct

        name = $(this).getCorrectStyleName(name);
        return win.getComputedStyle(this[0])[name];
      } else {
        for (var key in name) {
          if (Object.prototype.hasOwnProperty.call(name, key)) {
            this.css(key, name[key]);
          }
        }

        return this;
      }
    },
    toggleClass: function toggleClass(name, val) {
      if (name.split(' ').length > 1) {
        var names = name.split(' ');

        for (var i = 0; i < names.length; i++) {
          this.toggleClass(names[i], val);
        }

        return this;
      }

      for (var _i5 = 0; _i5 < this.length; _i5++) {
        if (typeof val === 'undefined') {
          if (this[_i5].classList.contains(name)) {
            this[_i5].classList.remove(name);
          } else {
            this[_i5].classList.add(name);
          }
        } else {
          if (val) {
            if (!this[_i5].classList.contains(name)) {
              this[_i5].classList.add(name);
            }
          } else {
            if (this[_i5].classList.contains(name)) {
              this[_i5].classList.remove(name);
            }
          }
        }
      }

      return this;
    },
    addClass: function addClass(name) {
      if (name.length === 0) return this;

      if (name.split(' ').length > 1) {
        var names = name.split(' ');

        for (var i = 0; i < names.length; i++) {
          this.addClass(names[i]);
        }

        return this;
      }

      for (var _i6 = 0; _i6 < this.length; _i6++) {
        this[_i6].classList.add(name);
      }

      return this;
    },
    removeClass: function removeClass(name) {
      if (name.split(' ').length > 1) {
        var names = name.split(' ');

        for (var i = 0; i < names.length; i++) {
          names[i] = names[i].trim();

          if (names[i].length) {
            this.removeClass(names[i]);
          }
        }

        return this;
      }

      for (var _i7 = 0; _i7 < this.length; _i7++) {
        if (name.length) {
          this[_i7].classList.remove(name);
        }
      }

      return this;
    },
    getClass: function getClass(elem) {
      return elem.getAttribute && elem.getAttribute('class') || '';
    },
    stripAndCollapse: function stripAndCollapse(value) {
      var rnothtmlwhite = /[^\x20\t\r\n\f]+/g;
      var tokens = value.match(rnothtmlwhite) || [];
      return tokens.join(' ');
    },
    hasClass: function hasClass(selector) {
      var className,
          elem,
          i = 0;
      className = ' ' + selector + ' ';

      while (elem = this[i++]) {
        if (elem.nodeType === 1 && (' ' + $(this).stripAndCollapse($(this).getClass(elem)) + ' ').indexOf(className) > -1) {
          return true;
        }
      }

      return false;
    },
    scrollTop: function scrollTop(val) {
      if (typeof val !== 'undefined') {
        for (var i = 0; i < this.length; i++) {
          if (this[i] === document) {
            window.scrollTo(document.documentElement.scrollLeft, val);
          } else {
            this[i].scrollTop = val;
          }
        }
      } else {
        if (this.length === 0) return undefined;

        if (this[0] === document) {
          return document.documentElement.scrollTop;
        }

        return this[0].scrollTop;
      }
    },
    scrollLeft: function scrollLeft(val) {
      if (typeof val !== 'undefined') {
        for (var i = 0; i < this.length; i++) {
          if (this[i] === document) {
            window.scrollTo(val, document.documentElement.scrollTop);
          } else {
            this[i].scrollLeft = val;
          }
        }
      } else {
        if (this.length === 0) return undefined;

        if (this[0] === document) {
          return document.documentElement.scrollLeft;
        }

        return this[0].scrollLeft;
      }
    },
    on: function on(eventName, selector, fn) {
      if (eventName.split(' ').length > 1) {
        var events = eventName.split(' ');

        for (var i = 0; i < events.length; i++) {
          // If it is a browser dependent or irregular event
          if (irregularEvents.indexOf(eventName) !== -1) {
            // Bind all events created by attaching all possible prefixes
            for (var j = 0; j < eventPrefixes.length; j++) {
              this.on(eventPrefixes[j] + eventName[0].toUpperCase() + eventName.slice(1), selector, fn);
            }
          } else {
            this.on(events[i], selector, fn);
          }
        } // Chain.


        return this;
      }

      if (typeof selector === 'function') {
        fn = _getDelegator(selector, null);
      } else {
        fn = _getDelegator(fn, selector);
      }

      for (var _i8 = 0; _i8 < this.length; _i8++) {
        var $el = $(this[_i8]);

        if (!$el.data('events')) {
          $el.data('events', []);
        }

        var eventHandlers = $el.data('events');
        eventHandlers.push([eventName, fn]);
        var domEvent = eventName.split('.');
        domEvent = domEvent[0];

        if (passiveEvents.indexOf(domEvent) >= 0) {
          $el.get(0).addEventListener(domEvent, fn, {
            passive: true
          });
        } else {
          $el.get(0).addEventListener(domEvent, fn);
        }
      }
    },
    off: function off(eventName) {
      if (eventName.split(' ').length > 1) {
        var events = eventName.split(' ');

        for (var i = 0; i < events.length; i++) {
          this.off(events[i]);
        } // Chain.


        return this;
      }

      for (var _i9 = 0; _i9 < this.length; _i9++) {
        var $el = $(this[_i9]);
        var eventHandlers = $el.data('events');

        if (eventHandlers) {
          var domEvent = eventName.split('.');
          domEvent = domEvent[0];

          var _eventHandlers = $el.data('events') || [];

          for (var k = _eventHandlers.length - 1; k >= 0; k--) {
            var eventHandler = _eventHandlers[k];

            if (eventHandler[0] == eventName) {
              $el.get(0).removeEventListener(domEvent, eventHandler[1]);

              _eventHandlers.splice(k, 1);
            }
          }
        }
      }
    },
    trigger: function trigger(type) {
      for (var i = 0; i < this.length; i++) {
        var event = void 0; // If it is a mouse event

        if (typeof Event === 'function') {
          if (type.search(/^mouse/g) >= 0) {
            event = new MouseEvent(type, {
              view: window,
              cancelable: true,
              bubbles: true
            });
          } else {
            event = new Event(type);
          }
        } else {
          // If it is a mouse event
          if (type.search(/^mouse/g) >= 0) {
            event = document.createEvent('MouseEvents');
            event.initMouseEvent(type, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
          } else {
            event = document.createEvent('Event');
            event.initEvent(type, true, true);
          }
        } // Handle special events separately


        if (specialEvents.indexOf(type) >= 0 && typeof this[i][type] === 'function') {
          this[i][type]();
        } else {
          this[i].dispatchEvent(event);
        }
      }
    },
    triggerHandler: function triggerHandler() {},
    val: function val(new_val) {
      if (typeof new_val != 'undefined') {
        for (var i = 0; i < this.length; i++) {
          this[i].value = new_val;
        }

        return this;
      } else {
        return this[0].value;
      }
    },
    siblings: function siblings() {
      return $(this[0]).parent().children().not(this);
    },
    find: function find(selector) {
      var ret = $();

      if (typeof selector !== 'string') {
        for (var i = 0; i < selector.length; i++) {
          for (var j = 0; j < this.length; j++) {
            if (this[j] !== selector[i] && $(this[j]).contains(selector[i])) {
              ret.push(selector[i]);
              break;
            }
          }
        }

        return ret;
      }

      var isElement = function isElement(o) {
        return (typeof HTMLElement === "undefined" ? "undefined" : _typeof(HTMLElement)) === 'object' ? o instanceof HTMLElement : //DOM2
        o && _typeof(o) === 'object' && o !== null && o.nodeType === 1 && typeof o.nodeName === 'string';
      };

      selector = _normalizeSelector(selector);

      for (var _i10 = 0; _i10 < this.length; _i10++) {
        if (this[_i10].querySelectorAll) {
          var els = [];

          if (selector && typeof selector == 'string') {
            els = this[_i10].querySelectorAll(selector);
          } else if (isElement(selector)) {
            els = [selector];
          }

          for (var _j = 0; _j < els.length; _j++) {
            ret.push(els[_j]);
          }
        }
      }

      return ret;
    },
    children: function children() {
      var ret = $();

      for (var i = 0; i < this.length; i++) {
        var cldrn = this[i].children;

        for (var j = 0; j < cldrn.length; j++) {
          ret.push(cldrn[j]);
        }
      }

      return ret;
    },
    not: function not(selector) {
      if (typeof selector === 'string') {
        for (var i = this.length - 1; i >= 0; i--) {
          if (this[i].matches(selector)) {
            this.splice(i, 1);
          }
        }
      } else {
        if (selector instanceof jQuery) {
          for (var _i11 = this.length - 1; _i11 >= 0; _i11--) {
            for (var j = 0; j < selector.length; j++) {
              if (this[_i11] === selector[j]) {
                this.splice(_i11, 1);
                break;
              }
            }
          }
        } else {
          for (var _i12 = this.length - 1; _i12 >= 0; _i12--) {
            if (this[_i12] === selector[0]) {
              this.splice(_i12, 1);
            }
          }
        }
      }

      return this;
    },
    add: function add(ary) {
      for (var i = 0; i < ary.length; i++) {
        this.push(ary[i]);
      }

      return this;
    },
    closest: function closest(selector) {
      for (var i = 0; i < this.length; i++) {
        var clst = this[i].closest && this[i].closest(selector);
        if (clst) return $(clst);
      }

      return $();
    },
    html: function html(str) {
      if (typeof str == 'undefined') {
        if (this.length === 0) return undefined;
        return this[0].innerHTML;
      }

      if (typeof str === 'string') {
        for (var i = 0; i < this.length; i++) {
          this[i].innerHTML = str; // If any of the child nodes are scripts then run them

          var children = this[i].children;
          var doc = this[i].ownerDocument || document;

          for (var j = 0; j < children.length; j++) {
            if (children[j].tagName === 'SCRIPT') {
              var script = doc.createElement('script');
              script.innerHTML = children[j].innerHTML;
              doc.head.appendChild(script).parentNode.removeChild(script);
            }
          }
        }
      } else {
        this[0].innerHTML = '';
        this.append(str[0]); // Execute if it is script tag

        var _doc = this[0].ownerDocument || document;

        if (str[0].tagName === 'SCRIPT') {
          var _script = _doc.createElement('script');

          _script.innerHTML = str[0].innerHTML;

          _doc.head.appendChild(_script).parentNode.removeChild(_script);
        }
      }

      return this;
    },
    text: function text(content) {
      if (content) {
        for (var i = 0; i < this.length; i++) {
          this[i].textContent = content;
        }
      } else {
        if (!this.length) return '';
        return this[0].textContent;
      }
    },
    after: function after(content) {
      if (content) {
        if (typeof content == 'string') {
          for (var i = 0; i < this.length; i++) {
            var after = this[i];

            if (after.nodeType != Node.ELEMENT_NODE) {
              var doc = after.ownerDocument;
              var tmp = doc.createElement('SPAN');
              $(after).after(tmp);
              $(tmp).after(content).remove();
            } else {
              after.insertAdjacentHTML('afterend', content);
            }
          }
        } else {
          var _after = this[0];

          if (_after.nextSibling) {
            if (content instanceof jQuery) {
              for (var _i13 = 0; _i13 < content.length; _i13++) {
                _after.nextSibling.parentNode.insertBefore(content[_i13], _after.nextSibling);
              }
            } else {
              _after.nextSibling.parentNode.insertBefore(content, _after.nextSibling);
            }
          } else {
            $(_after.parentNode).append(content);
          }
        }
      }

      return this;
    },
    clone: function clone(deep) {
      var ret = $();

      for (var i = 0; i < this.length; i++) {
        ret.push(this[i].cloneNode(deep));
      }

      return ret;
    },
    replaceWith: function replaceWith(content) {
      if (typeof content === 'string') {
        for (var i = 0; i < this.length; i++) {
          if (this[i].parentNode) {
            this[i].outerHTML = content;
          }
        }
      } else if (content.length) {
        for (var _i14 = 0; _i14 < this.length; _i14++) {
          this.replaceWith(content[_i14]);
        }
      } else {
        this.after(content).remove();
      }
    },
    insertBefore: function insertBefore(el) {
      $(el).before(this[0]);
      return this;
    },
    before: function before(content) {
      if (content instanceof jQuery) {
        for (var i = 0; i < content.length; i++) {
          this.before(content[i]);
        }

        return this;
      }

      if (content) {
        if (typeof content == 'string') {
          for (var _i15 = 0; _i15 < this.length; _i15++) {
            var before = this[_i15];

            if (before.nodeType != Node.ELEMENT_NODE) {
              var doc = before.ownerDocument;
              var tmp = doc.createElement('SPAN');
              $(before).before(tmp);
              $(tmp).before(content).remove();
            } else {
              if (before.parentNode) {
                before.insertAdjacentHTML('beforebegin', content);
              }
            }
          }
        } else {
          var _before = this[0];

          if (_before.parentNode) {
            if (content instanceof jQuery) {
              for (var _i16 = 0; _i16 < content.length; _i16++) {
                _before.parentNode.insertBefore(content[_i16], _before);
              }
            } else {
              _before.parentNode.insertBefore(content, _before);
            }
          }
        }
      }

      return this;
    },
    append: function append(content) {
      if (this.length == 0) return this;

      if (typeof content == 'string') {
        for (var i = 0; i < this.length; i++) {
          var parent = this[i];
          var doc = parent.ownerDocument;
          var tmp = doc.createElement('SPAN');
          $(parent).append(tmp);
          $(tmp).after(content).remove();
        }
      } else {
        if (content instanceof jQuery || Array.isArray(content)) {
          for (var _i17 = 0; _i17 < content.length; _i17++) {
            this.append(content[_i17]);
          }
        } else {
          if (typeof content !== 'function') {
            this[0].appendChild(content);
          }
        }
      }

      return this;
    },
    prepend: function prepend(content) {
      if (this.length == 0) return this;

      if (typeof content == 'string') {
        for (var i = 0; i < this.length; i++) {
          var parent = this[i];
          var doc = parent.ownerDocument;
          var tmp = doc.createElement('SPAN');
          $(parent).prepend(tmp);
          $(tmp).before(content).remove();
        }
      } else {
        if (content instanceof jQuery) {
          for (var _i18 = 0; _i18 < content.length; _i18++) {
            this.prepend(content[_i18]);
          }
        } else {
          var _parent = this[0];

          if (!_parent.firstChild) {
            $(_parent).append(content);
          } else {
            if (_parent.firstChild) {
              _parent.insertBefore(content, _parent.firstChild);
            } else {
              _parent.appendChild(content);
            }
          }
        }
      }

      return this;
    },
    remove: function remove() {
      for (var i = 0; i < this.length; i++) {
        if (this[i].parentNode) {
          this[i].parentNode.removeChild(this[i]);
        }
      }

      return this;
    },
    prev: function prev() {
      // replicate the jQuery behavior
      if (this.length && this[0].previousElementSibling) {
        return $(this[0].previousElementSibling);
      } else {
        return $();
      }
    },
    next: function next() {
      if (this.length && this[0].nextElementSibling) {
        return $(this[0].nextElementSibling);
      } else {
        return $();
      }
    },
    outerHeight: function outerHeight(margin) {
      if (this.length === 0) return undefined;
      var el = this[0];

      if (el === el.window) {
        return el.innerHeight;
      } // Remember the old values, and insert the new ones


      var old = {};
      var isVisible = this.isVisible();

      if (!isVisible) {
        for (var _name in cssShow) {
          old[_name] = el.style[_name];
          el.style[_name] = cssShow[_name];
        }
      }

      var height = el.offsetHeight;

      if (margin) {
        height += parseInt($(el).css('marginTop')) + parseInt($(el).css('marginBottom'));
      } // Revert the old values


      if (!isVisible) {
        for (var _name2 in cssShow) {
          el.style[_name2] = old[_name2];
        }
      }

      return height;
    },
    outerWidth: function outerWidth(margin) {
      if (this.length === 0) return undefined;
      var el = this[0];

      if (el === el.window) {
        return el.outerWidth;
      } // Remember the old values, and insert the new ones


      var old = {};
      var isVisible = this.isVisible();

      if (!isVisible) {
        for (var _name3 in cssShow) {
          old[_name3] = el.style[_name3];
          el.style[_name3] = cssShow[_name3];
        }
      }

      var width = el.offsetWidth;

      if (margin) {
        width += parseInt($(el).css('marginLeft')) + parseInt($(el).css('marginRight'));
      } // Revert the old values


      if (!isVisible) {
        for (var _name4 in cssShow) {
          el.style[_name4] = old[_name4];
        }
      }

      return width;
    },
    width: function width(newWidth) {
      if (newWidth === undefined) {
        if (this[0] instanceof HTMLDocument) {
          return this[0].body.offsetWidth;
        }

        return this[0].offsetWidth;
      } else {
        this[0].style.width = newWidth + 'px';
      }
    },
    height: function height(newHeight) {
      var elem = this[0];

      if (newHeight === undefined) {
        if (elem instanceof HTMLDocument) {
          var doc = elem.documentElement;
          return Math.max(elem.body.scrollHeight, doc.scrollHeight, elem.body.offsetHeight, doc.offsetHeight, doc.clientHeight);
        }

        return elem.offsetHeight;
      } else {
        elem.style.height = newHeight + 'px';
      }
    },
    is: function is(el) {
      if (this.length === 0) return false;

      if (typeof el == 'string' && this[0].matches) {
        return this[0].matches(el);
      } else if (el instanceof jQuery) {
        return this[0] == el[0];
      } else {
        return this[0] == el;
      }
    },
    parent: function parent() {
      if (this.length === 0) return $();
      return $(this[0].parentNode);
    },
    parents: function parents(selector) {
      var ret = $();

      for (var i = 0; i < this.length; i++) {
        var el = this[i].parentNode;

        while (el && el != document && el.matches) {
          if (selector) {
            if (el.matches(selector)) {
              ret.push(el);
            }
          } else {
            ret.push(el);
          }

          el = el.parentNode;
        }
      }

      return ret;
    },
    parentsUntil: function parentsUntil(until, selector) {
      var ret = $();

      if (until instanceof jQuery && until.length > 0) {
        until = until[0];
      }

      for (var i = 0; i < this.length; i++) {
        var el = this[i].parentNode;

        while (el && el != document && el.matches && el != until && this[i] != until && !(typeof until == 'string' && el.matches(until))) {
          if (selector) {
            if (el.matches(selector)) {
              ret.push(el);
            }
          } else {
            ret.push(el);
          }

          el = el.parentNode;
        }
      }

      return ret;
    },
    insertAfter: function insertAfter(elem) {
      var parentNode = elem.parent()[0];

      if (parentNode) {
        parentNode.insertBefore(this[0], elem[0].nextElementSibling);
      }
    },
    filter: function filter(fn) {
      var ret = $();

      if (typeof fn === 'function') {
        for (var i = 0; i < this.length; i++) {
          if (fn.call(this[i], this[i])) {
            ret.push(this[i]);
          }
        }
      } else if (typeof fn === 'string') {
        for (var _i19 = 0; _i19 < this.length; _i19++) {
          if (this[_i19].matches(fn)) {
            ret.push(this[_i19]);
          }
        }
      }

      return ret;
    },
    offset: function offset() {
      var rect = this[0].getBoundingClientRect();
      var win = this[0].ownerDocument.defaultView;
      return {
        top: rect.top + win.pageYOffset,
        left: rect.left + win.pageXOffset
      };
    },
    position: function position() {
      return {
        left: this[0].offsetLeft,
        top: this[0].offsetTop
      };
    },
    // For internal use only.
    // Behaves like an Array's method, not like a jQuery method.
    push: [].push,
    splice: [].splice
  };

  jQuery.extend = function (new_obj) {
    new_obj = new_obj || {}; // Loop arguments.

    for (var i = 1; i < arguments.length; i++) {
      if (!arguments[i]) continue;

      for (var key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) new_obj[key] = arguments[i][key];
      }
    }

    return new_obj;
  };

  jQuery.merge = function (first, second) {
    var len = +second.length,
        j = 0,
        i = first.length;

    for (; j < len; j++) {
      first[i++] = second[j];
    }

    first.length = i;
    return first;
  };

  jQuery.map = function (elems, callback, arg) {
    var length,
        value,
        i = 0,
        ret = []; // Go through the array, translating each of the items to their new values

    if (Array.isArray(elems)) {
      length = elems.length;

      for (; i < length; i++) {
        value = callback(elems[i], i, arg);

        if (value != null) {
          ret.push(value);
        }
      } // Go through every key on the object,

    } else {
      for (i in elems) {
        value = callback(elems[i], i, arg);

        if (value != null) {
          ret.push(value);
        }
      }
    } // Flatten any nested arrays


    return [].concat.apply([], ret);
  };

  var init = function init(selector, context) {
    if (!selector) {
      return this;
    }

    if (typeof selector == 'string' && selector[0] === '<') {
      var tmp = document.createElement('DIV');
      tmp.innerHTML = selector;
      return $(tmp.firstElementChild);
    }

    context = context instanceof jQuery ? context[0] : context;

    if (typeof selector == 'string') {
      selector = _normalizeSelector(selector);
      var els = (context || document).querySelectorAll(selector);

      for (var i = 0; i < els.length; i++) {
        this[i] = els[i];
      }

      this.length = els.length;
      return this;
    } else {
      if (!(selector instanceof jQuery)) {
        this[0] = selector;
        this.length = 1;
        return this;
      }

      return selector;
    }
  };

  init.prototype = jQuery.prototype;

  var FE = FroalaEditor;

  function init$1(e) {
    if (e.type === 'touchend' && !this.$el.data('touched')) {
      return true;
    }

    if (e.which === 1 || !e.which) {
      this.$el.off('mousedown.init touchstart.init touchmove.init touchend.init dragenter.init focus.init');
      this.load(FE.MODULES);
      this.load(FE.PLUGINS);
      var target = e.originalEvent && e.originalEvent.originalTarget;

      if (target && target.tagName === 'IMG') {
        jQuery(target).trigger('mousedown');
      }

      if (typeof this.ul === 'undefined') {
        this.destroy();
      }

      if (e.type === 'touchend' && this.image && e.originalEvent && e.originalEvent.target && jQuery(e.originalEvent.target).is('img')) {
        var that = this;
        setTimeout(function () {
          that.image.edit(jQuery(e.originalEvent.target));
        }, 100);
      }

      this.ready = true;
      this.events.trigger('initialized');
    }
  }

  function doInit() {
    this.doc = this.$el.get(0).ownerDocument;
    this.win = 'defaultView' in this.doc ? this.doc.defaultView : this.doc.parentWindow;
    this.$doc = jQuery(this.doc);
    this.$win = jQuery(this.win);

    if (!this.opts.pluginsEnabled) {
      this.opts.pluginsEnabled = Object.keys(FE.PLUGINS);
    }

    if (this.opts.initOnClick) {
      this.load(FE.MODULES); // https://github.com/froala/wysiwyg-editor/issues/1207.

      this.$el.on('touchstart.init', function () {
        jQuery(this).data('touched', true);
      });
      this.$el.on('touchmove.init', function () {
        jQuery(this).removeData('touched');
      });
      this.$el.on('mousedown.init touchend.init dragenter.init focus.init', init$1.bind(this));
      this.events.trigger('initializationDelayed');
    } else {
      this.load(FE.MODULES);
      this.load(FE.PLUGINS);
      jQuery(this.o_win).scrollTop(this.c_scroll);

      if (typeof this.ul === 'undefined') {
        this.destroy();
      }

      this.ready = true;
      this.events.trigger('initialized');
    }
  }

  FE.Bootstrap = function (element, options, initCallback) {
    this.id = ++FE.ID;
    this.$ = jQuery;
    var presets = {}; // If init callback is passed and no options.

    if (typeof options == 'function') {
      initCallback = options;
      options = {};
    }

    if (initCallback) {
      if (!options.events) options.events = {};
      options.events.initialized = initCallback;
    }

    if (options && options.documentReady) {
      presets.toolbarButtons = [['fullscreen', 'undo', 'redo', 'getPDF', 'print'], ['bold', 'italic', 'underline', 'textColor', 'backgroundColor', 'clearFormatting'], ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify'], ['formatOL', 'formatUL', 'indent', 'outdent'], ['paragraphFormat'], ['fontFamily'], ['fontSize'], ['insertLink', 'insertImage', 'quote']];
      presets.paragraphFormatSelection = true;
      presets.fontFamilySelection = true;
      presets.fontSizeSelection = true;
      presets.placeholderText = '';
      presets.quickInsertEnabled = false;
      presets.charCounterCount = false;
    }

    this.opts = Object.assign({}, Object.assign({}, FE.DEFAULTS, presets, _typeof(options) === 'object' && options));
    var opts_string = JSON.stringify(this.opts);
    FE.OPTS_MAPPING[opts_string] = FE.OPTS_MAPPING[opts_string] || this.id;
    this.sid = FE.OPTS_MAPPING[opts_string];
    FE.SHARED[this.sid] = FE.SHARED[this.sid] || {};
    this.shared = FE.SHARED[this.sid];
    this.shared.count = (this.shared.count || 0) + 1;
    this.$oel = jQuery(element);
    this.$oel.data('froala.editor', this);
    this.o_doc = element.ownerDocument;
    this.o_win = 'defaultView' in this.o_doc ? this.o_doc.defaultView : this.o_doc.parentWindow;
    this.c_scroll = jQuery(this.o_win).scrollTop();

    this._init();
  };

  FE.Bootstrap.prototype._init = function () {
    // Get the tag name of the original element.
    var tag_name = this.$oel.get(0).tagName;

    if (this.$oel.closest('label').length >= 1) {
      //
      console.warn('Note! It is not recommended to initialize the Froala Editor within a label tag.');
    }

    var initOnDefault = function () {
      if (tag_name !== 'TEXTAREA') {
        this._original_html = this._original_html || this.$oel.html();
      }

      this.$box = this.$box || this.$oel; // Turn on iframe if fullPage is on.

      if (this.opts.fullPage) {
        this.opts.iframe = true;
      }

      if (!this.opts.iframe) {
        this.$el = jQuery(this.o_doc.createElement('DIV'));
        this.el = this.$el.get(0);
        this.$wp = jQuery(this.o_doc.createElement('DIV')).append(this.$el);
        this.$box.html(this.$wp);
        setTimeout(doInit.bind(this), 0);
      } else {
        this.$iframe = jQuery('<iframe src="about:blank" frameBorder="0">');
        this.$wp = jQuery('<div></div>');
        this.$box.html(this.$wp);
        this.$wp.append(this.$iframe);
        this.$iframe.get(0).contentWindow.document.open();
        this.$iframe.get(0).contentWindow.document.write('<!DOCTYPE html>');
        this.$iframe.get(0).contentWindow.document.write('<html><head></head><body></body></html>');
        this.$iframe.get(0).contentWindow.document.close();
        this.iframe_document = this.$iframe.get(0).contentWindow.document;
        this.$el = jQuery(this.iframe_document.querySelector('body'));
        this.el = this.$el.get(0);
        this.$head = jQuery(this.iframe_document.querySelector('head'));
        this.$html = jQuery(this.iframe_document.querySelector('html'));
        setTimeout(doInit.bind(this), 0);
      }
    }.bind(this);

    var initOnTextarea = function () {
      this.$box = jQuery('<div>');
      this.$oel.before(this.$box).hide();
      this._original_html = this.$oel.val(); // Before submit textarea do a sync.

      var that = this;
      this.$oel.parents('form').on("submit.".concat(this.id), function () {
        that.events.trigger('form.submit');
      });
      this.$oel.parents('form').on("reset.".concat(this.id), function () {
        that.events.trigger('form.reset');
      });
      initOnDefault();
    }.bind(this);

    var initOnA = function () {
      this.$el = this.$oel;
      this.el = this.$el.get(0);
      this.$el.attr('contenteditable', true).css('outline', 'none').css('display', 'inline-block');
      this.opts.multiLine = false;
      this.opts.toolbarInline = false;
      setTimeout(doInit.bind(this), 0);
    }.bind(this);

    var initOnImg = function () {
      this.$el = this.$oel;
      this.el = this.$el.get(0);
      this.opts.toolbarInline = false;
      setTimeout(doInit.bind(this), 0);
    }.bind(this);

    var editInPopup = function () {
      this.$el = this.$oel;
      this.el = this.$el.get(0);
      this.opts.toolbarInline = false;
      this.$oel.on('click.popup', function (e) {
        e.preventDefault();
      });
      setTimeout(doInit.bind(this), 0);
    }.bind(this); // Check on what element it was initialized.


    if (this.opts.editInPopup) {
      editInPopup();
    } else if (tag_name === 'TEXTAREA') {
      initOnTextarea();
    } else if (tag_name === 'A') {
      initOnA();
    } else if (tag_name === 'IMG') {
      initOnImg();
    } else if (tag_name === 'BUTTON' || tag_name === 'INPUT') {
      this.opts.editInPopup = true;
      this.opts.toolbarInline = false;
      editInPopup();
    } else {
      initOnDefault();
    }
  };

  FE.Bootstrap.prototype.load = function (module_list) {
    // Bind modules to the current instance and tear them up.
    for (var m_name in module_list) {
      if (Object.prototype.hasOwnProperty.call(module_list, m_name)) {
        if (this[m_name]) {
          continue;
        } // Do not include plugin.


        if (FE.PLUGINS[m_name] && this.opts.pluginsEnabled.indexOf(m_name) < 0) {
          continue;
        }

        this[m_name] = new module_list[m_name](this);

        if (this[m_name]._init) {
          this[m_name]._init();

          if (this.opts.initOnClick && m_name === 'core') {
            return false;
          }
        }
      }
    }
  };

  FE.Bootstrap.prototype.destroy = function () {
    this.destrying = true;
    this.shared.count--;
    this.events && this.events.$off(); // HTML.

    var html = this.html && this.html.get(); // Focus main frame.

    if (this.opts.iframe) {
      this.events.disableBlur();
      this.win.focus();
      this.events.enableBlur();
    }

    if (this.events) {
      this.events.trigger('destroy', [], true);
      this.events.trigger('shared.destroy', [], true);
    } // Remove shared.


    if (this.shared.count === 0) {
      for (var k in this.shared) {
        if (Object.prototype.hasOwnProperty.call(this.shared, k)) {
          this.shared[k] = null;
          FE.SHARED[this.sid][k] = null;
        }
      }

      delete FE.SHARED[this.sid];
    }

    this.$oel.parents('form').off(".".concat(this.id));
    this.$oel.off('click.popup');
    this.$oel.removeData('froala.editor');
    this.$oel.off('froalaEditor'); // Destroy editor basic elements.

    if (this.core) {
      this.core.destroy(html);
    }

    FE.INSTANCES.splice(FE.INSTANCES.indexOf(this), 1);
  };

  return FroalaEditor;

})));
//# sourceMappingURL=froala_editor.js.map
