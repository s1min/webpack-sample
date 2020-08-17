const fs = require('fs');
const parser = require('@babel/parser'); // 将源码生成 AST
const traverse = require('@babel/traverse'); // 对 AST 节点进行递归遍历
const { transformFromAst } = require('babel-core'); // 将获得的 ES6 的 AST 转化为 ES5

module.exports = {
  // 解析代码生成 AST
  getAST: (path) => {
    const source = fs.readFileSync(path, 'utf-8');
    const ast = parser.parse(source, {
      sourceType: 'module', // 表示要解析的是 ES 模块
    });
    return ast;
  },

  // 对 AST 进行递归遍历，将用到的依赖收集起来
  getDependencies: (ast) => {
    const dependencies = [];
    traverse(ast, {
      ImportDeclaration: ({ node }) => {
        dependencies.push(node.source.value);
      },
    });
    return dependencies;
  },

  // 将获得的 ES6 的 AST 转化为 ES5
  transform: (ast) => {
    const { code } = transformFromAst(ast, null, {
      presets: ['env'],
    });
    return code;
  },
};
