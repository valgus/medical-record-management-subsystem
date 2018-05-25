import React, { Component } from 'react'

import ReactQuill from 'react-quill';

// Accessing the Quill backing instance using React ref functions

class TemplateEditor extends React.Component {
  constructor (props) {
    super(props)
    this.state = { editorHtml: '', mountedEditor: false, notes: '', linkedQuestions: [] }
    this.quillRef = null;
    this.reactQuillRef = null;
    this.handleChange = this.handleChange.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.attachQuillRefs = this.attachQuillRefs.bind(this);
    this.setChosenVariable = this.setChosenVariable.bind(this);
  }

  componentDidMount () {
      this.attachQuillRefs();
      this.setState({notes: this.props.part.notes, editorHtml: this.props.part.delta, linkedQuestions: this.props.part.linkedQuestions });
  }

  componentDidUpdate () {
    this.attachQuillRefs()
  }

  attachQuillRefs() {
    // Ensure React-Quill reference is available:
    if (typeof this.reactQuillRef.getEditor !== 'function') return;
    // Skip if Quill reference is defined:
    if (this.quillRef != null) return;

    const quillRef = this.reactQuillRef.getEditor();
    if (quillRef != null) this.quillRef = quillRef;
  }

  handleClick () {
    // const Quill = require('quill');
    // const deltaOps =  this.reactQuillRef.getEditor().getContents();
    // const tempCont = document.createElement("div");
    // (new Quill(tempCont)).setContents(deltaOps);
    //
    // const rawHtml = tempCont.getElementsByClassName("ql-editor")[0].innerHTML;
    // const html = convertToHtml(rawHtml);
    //
    // linkedQuestions = linkedQuestions.filter(question => rawHtml.indexOf(question) >= 0);
    // console.log(linkedQuestions);
    // if (this.props.index === -1)
    //   return this.props.save(html, rawHtml, linkedQuestions, this.state.notes, -1);
    // return this.props.save(html, rawHtml, linkedQuestions, this.state.notes, this.props.index);
  }

  handleChange (html) {
  	this.setState({ editorHtml: html });
    this.props.changePart(this.props.index, html);
  }

  setChosenVariable(id, name) {
    this.setState({chosenQuestion: {id, name}});
  }

  render () {
    return (
      <div>
      <ReactQuill
        ref={(el) => { this.reactQuillRef = el }}
        theme={'bubble'}
        onChange={this.handleChange}
        modules={TemplateEditor.modules}
        formats={TemplateEditor.formats}
        defaultValue={ this.props.part.delta}
        placeholder="Enter text"
        />
       </div>
     )
  }
}

/*
 * Quill modules to attach to editor
 * See https://quilljs.com/docs/modules/ for complete options
 */
TemplateEditor.modules = {}
TemplateEditor.modules.toolbar = [
  [{ 'header': [1, 2, 3, 4, false] }],
  ['bold', 'italic', 'underline','strike'],
  [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'font': [] }],
  [{ 'align': [] }],
  ['link', 'image']
],


/*
 * Quill editor formats
 * See https://quilljs.com/docs/formats/
 */
TemplateEditor.formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'color', 'background',
    'font',
    'align',
    'link', 'image'
  ]


export default TemplateEditor;
