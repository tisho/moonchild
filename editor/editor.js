var options = {};
var codeMirror;  // TODO: Get rid of this global.
var moonchild = Moonchild.registerExtension();
Moonchild.setEditor(new Editor());

// Private helpers
// ---------------

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function editorOnChange(cm, changeObj) {
  Moonchild.onChange(cm.getValue());
}

function toggle(el, value) {
  if (value !== undefined)
    el.classList.toggle('on', value);
  else
    el.classList.toggle('on')

  options[el.id] = el.classList.contains('on');
}

function initializeExtensionToggles(cm) {
  var controls = $$('#controls > div');
  for (var i = 0; i < controls.length; i++) {
    controls[i].addEventListener('click', function(e) {
      toggle(this);
      e.preventDefault();
      if (this.id == 'all') {
        for (var j = 0; j < controls.length; j++)
          toggle(controls[j], this.classList.contains('on'));
      }
      Moonchild.onChange(cm.getValue());
    });
  }
}

function renderNode(cm, node) {
  var widgetInfo = moonchild.getWidget(node);
  if (widgetInfo) {
    renderWidget(cm, node, widgetInfo);
  } else {
    clearWidgets(cm, node);
  }
}

// Editor
// ------

function Editor() {
  codeMirror = this._codeMirror = CodeMirror.fromTextArea($('textarea'));
  codeMirror.on('change', _.debounce(editorOnChange, 250));

  var render = _.partial(renderNode, codeMirror);
  moonchild.on('render', function(ast, comments) {
    ast.each(render);
    comments.each(render);
  });

  codeMirror.on('cursorActivity', function(cm, e) {
    var adjacentMarks = cm.findMarksAt(cm.getCursor());
    if (adjacentMarks.length == 0 || !adjacentMarks[0].replacedWith)
      return;

    var markEl = widgetForMark(adjacentMarks[0]);
    var widgetType = markEl._moonchildWidgetType;
    if (widgetType && widgetType.editable)
      console.log(markEl);
  });

  initializeExtensionToggles(codeMirror);

  setTimeout(function() {
    toggle($('#preview'));
    Moonchild.onChange(codeMirror.getValue());
  }, 500);
}

Editor.prototype.getValue = function() {
  return this._codeMirror.getValue();
}

Editor.prototype.replaceRange = function(fromOffset, toOffset, text) {
  this._codeMirror.replaceRange(text, fromOffset, toOffset);
}

Editor.prototype.insertText = function(offset, text) {
  this.replaceRange(offset, null, text);
}

Editor.prototype.replaceNodeText = function(node, text) {
  this.replaceRange(esLocToCm(node.loc.start), esLocToCm(node.loc.end), text);
}

Editor.prototype.selectNode = function(node) {
  selectNode(this._codeMirror, node);
}
