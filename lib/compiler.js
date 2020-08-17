/**
 * compiler.js 主要做了以下几个事情：
 * 1. 接收 mypack.config.js 配置参数，并初始化 entry、output
 * 2. 开启编译 run 方法，处理构建模块、收集依赖、输出文件等
 * 3. buildModule 方法，主要用于构建模块（被 run 方法调用）
 * 4. emitFiles 方法，输出文件（同样被 run 方法调用）
 */

const path = require('path');
const fs = require('fs');
const { getAST, getDependencies, transform } = require('./parser');

class Compiler {
  // 接收通过 lib/index.js 中 `new Compiler(options).run()` 传入的参数，对应 mypack.config.js 的配置
  constructor(options) {
    const { entry, output } = options;
    this.entry = entry;
    this.output = output;
    this.modules = [];
  }

  // 开启编译
  run() {
    const entryModule = this.buildModule(this.entry, true);

    this.modules.push(entryModule);
    this.modules.map((_module) => {
      _module.dependencies.map((dependency) => {
        this.modules.push(this.buildModule(dependency));
      });
    });

    this.emitFiles();
  }

  /**
   * 构建模块相关
   * @param {*} filename 文件名称
   * @param {*} isEntry 是否是入口文件
   */
  buildModule(filename, isEntry) {
    let ast;

    if (isEntry) {
      ast = getAST(filename);
    } else {
      const absolutePath = path.join(process.cwd(), './src', filename);
      ast = getAST(absolutePath);
    }

    return {
      filename, // 文件名称
      dependencies: getDependencies(ast), // 依赖列表
      transformCode: transform(ast), // 转化后的代码
    };
  }

  // 输入文件
  emitFiles() {
    const outputPath = path.join(this.output.path, this.output.filename);
    let modules = '';

    this.modules.map((_module) => {
      modules += `'${_module.filename}' : function(require, module, exports) {${_module.transformCode}},`;
    });

    const bundle = `
        (function(modules) {
          function require(fileName) {
            const fn = modules[fileName];
            const module = { exports:{}};
            fn(require, module, module.exports)
            return module.exports
          }
          require('${this.entry}')
        })({${modules}})
    `;

    fs.writeFileSync(outputPath, bundle, 'utf-8');
  }
}

module.export = Compiler;
