import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'İçerik yazın...',
  height = '400px'
}) => {
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false
    }
  }), []);

  function imageHandler(this: any) {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Resim boyutu 2MB\'dan küçük olmalıdır');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const quill = this.quill;
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', base64);
        quill.setSelection(range.index + 1);
      };
      reader.readAsDataURL(file);
    };
  }

  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'script',
    'list',
    'bullet',
    'indent',
    'direction',
    'align',
    'blockquote',
    'code-block',
    'link',
    'image',
    'video'
  ];

  return (
    <div className="rich-text-editor">
      <style>{`
        .rich-text-editor .ql-container {
          min-height: ${height};
          font-size: 16px;
          font-family: inherit;
        }

        .rich-text-editor .ql-editor {
          min-height: ${height};
        }

        .rich-text-editor .ql-toolbar {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px 8px 0 0;
          padding: 12px;
        }

        .rich-text-editor .ql-container {
          border: 1px solid #e5e7eb;
          border-radius: 0 0 8px 8px;
          background: white;
        }

        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }

        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 10px 0;
        }

        .rich-text-editor .ql-editor h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }

        .rich-text-editor .ql-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
        }

        .rich-text-editor .ql-editor h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
        }

        .rich-text-editor .ql-editor pre {
          background: #f3f4f6;
          border-radius: 4px;
          padding: 16px;
          overflow-x: auto;
        }

        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 16px;
          margin: 16px 0;
          color: #6b7280;
        }

        .rich-text-editor .ql-editor a {
          color: #3b82f6;
          text-decoration: underline;
        }

        .rich-text-editor .ql-editor ul,
        .rich-text-editor .ql-editor ol {
          padding-left: 24px;
          margin: 12px 0;
        }

        .rich-text-editor .ql-editor li {
          margin: 4px 0;
        }

        .rich-text-editor .ql-toolbar button:hover,
        .rich-text-editor .ql-toolbar button:focus,
        .rich-text-editor .ql-toolbar button.ql-active {
          color: #3b82f6;
        }

        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: #374151;
        }

        .rich-text-editor .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-toolbar button:focus .ql-stroke,
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #3b82f6;
        }

        .rich-text-editor .ql-toolbar .ql-fill {
          fill: #374151;
        }

        .rich-text-editor .ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-toolbar button:focus .ql-fill,
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #3b82f6;
        }

        .rich-text-editor .ql-tooltip {
          z-index: 1000;
        }
      `}</style>

      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />

      <div className="mt-2 text-xs text-gray-500">
        💡 İpuçları: Resim eklemek için resim butonuna tıklayın (max 2MB). HTML içerik otomatik olarak desteklenir.
      </div>
    </div>
  );
};

export default RichTextEditor;
