'use client';

import { useState } from 'react';
import { X, CheckCircle, Code, Layout, Briefcase } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: any;
  files: Record<string, string>;
  color: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'todo',
    name: 'Todo App',
    description: 'A simple todo list with add, edit, and delete functionality',
    icon: CheckCircle,
    color: 'from-green-600 to-emerald-600',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todo App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>My Todo List</h1>
    <div class="input-container">
      <input type="text" id="todoInput" placeholder="Add a new task...">
      <button onclick="addTodo()">Add</button>
    </div>
    <ul id="todoList"></ul>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      'style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.container {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  max-width: 500px;
  width: 100%;
}

h1 {
  color: #333;
  margin-bottom: 1.5rem;
  text-align: center;
}

.input-container {
  display: flex;
  gap: 10px;
  margin-bottom: 1.5rem;
}

input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
}

button {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

button:hover {
  background: #5568d3;
}

ul {
  list-style: none;
}

li {
  padding: 12px;
  background: #f5f5f5;
  margin-bottom: 10px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.delete-btn {
  padding: 6px 12px;
  background: #ef4444;
  font-size: 14px;
}

.delete-btn:hover {
  background: #dc2626;
}`,
      'script.js': `let todos = [];

function addTodo() {
  const input = document.getElementById('todoInput');
  const text = input.value.trim();

  if (text) {
    todos.push({ id: Date.now(), text });
    input.value = '';
    renderTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter(todo => todo.id !== id);
  renderTodos();
}

function renderTodos() {
  const list = document.getElementById('todoList');
  list.innerHTML = todos.map(todo => \`
    <li>
      <span>\${todo.text}</span>
      <button class="delete-btn" onclick="deleteTodo(\${todo.id})">Delete</button>
    </li>
  \`).join('');
}

document.getElementById('todoInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTodo();
});`,
    },
  },
  {
    id: 'blog',
    name: 'Blog Template',
    description: 'A clean blog layout with articles and responsive design',
    icon: Layout,
    color: 'from-blue-600 to-cyan-600',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Blog</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <nav>
      <h1>My Blog</h1>
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <article class="post">
      <h2>Welcome to My Blog</h2>
      <p class="meta">Posted on December 13, 2025</p>
      <p>This is a sample blog post. Start customizing this template to create your own amazing blog!</p>
    </article>

    <article class="post">
      <h2>Getting Started</h2>
      <p class="meta">Posted on December 12, 2025</p>
      <p>Edit the HTML to add your own posts, customize the CSS for your personal style, and make it yours!</p>
    </article>
  </main>

  <footer>
    <p>&copy; 2025 My Blog. All rights reserved.</p>
  </footer>
</body>
</html>`,
      'style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Georgia', serif;
  line-height: 1.6;
  color: #333;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

nav ul {
  list-style: none;
  display: flex;
  gap: 2rem;
}

nav a {
  color: white;
  text-decoration: none;
  transition: opacity 0.3s;
}

nav a:hover {
  opacity: 0.8;
}

main {
  max-width: 800px;
  margin: 3rem auto;
  padding: 0 2rem;
}

.post {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.post h2 {
  color: #667eea;
  margin-bottom: 0.5rem;
}

.meta {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

footer {
  background: #f5f5f5;
  text-align: center;
  padding: 2rem;
  margin-top: 4rem;
  color: #666;
}`,
    },
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'A professional portfolio to showcase your work',
    icon: Briefcase,
    color: 'from-purple-600 to-pink-600',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Portfolio</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>John Doe</h1>
    <p>Web Developer & Designer</p>
  </header>

  <section class="about">
    <h2>About Me</h2>
    <p>I'm a passionate developer who loves creating beautiful and functional websites.</p>
  </section>

  <section class="projects">
    <h2>Projects</h2>
    <div class="project-grid">
      <div class="project-card">
        <h3>Project 1</h3>
        <p>A cool web application</p>
      </div>
      <div class="project-card">
        <h3>Project 2</h3>
        <p>An awesome mobile app</p>
      </div>
      <div class="project-card">
        <h3>Project 3</h3>
        <p>A stunning website redesign</p>
      </div>
    </div>
  </section>

  <footer>
    <p>Contact: john@example.com</p>
  </footer>
</body>
</html>`,
      'style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  color: #333;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 5rem 2rem;
}

header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

section {
  max-width: 1200px;
  margin: 4rem auto;
  padding: 0 2rem;
}

h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #667eea;
}

.about p {
  text-align: center;
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.project-card {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.project-card:hover {
  transform: translateY(-5px);
}

.project-card h3 {
  color: #667eea;
  margin-bottom: 1rem;
}

footer {
  background: #f5f5f5;
  text-align: center;
  padding: 2rem;
  margin-top: 4rem;
}`,
    },
  },
];

interface TemplateGalleryProps {
  onSelect: (files: Record<string, string>) => void;
  onClose: () => void;
}

export default function TemplateGallery({ onSelect, onClose }: TemplateGalleryProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template.id);
    onSelect(template.files);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-4xl w-full p-8 relative border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold text-white mb-2">Choose a Template</h2>
        <p className="text-gray-400 mb-8">Start with a pre-built template or create from scratch</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEMPLATES.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="group bg-gray-900 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all text-left hover:transform hover:scale-105"
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${template.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {template.name}
                </h3>
                <p className="text-gray-400 text-sm">{template.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-3 px-6 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors"
          >
            Start from Scratch
          </button>
        </div>
      </div>
    </div>
  );
}
