import * as path from 'path';
import * as vscode from 'vscode';

type IRecentFile = { fsPath: string; label: string; workPath?: string };

/** 连接的客户端 */
let recentFiles: IRecentFile[] = [];

let treeDataProvider: MyTreeDataProvider;
let treeView: vscode.TreeView<IRecentFile>;

let treeDataExplorerProvider: MyTreeDataExplorerProvider;
let treeViewExplorer: vscode.TreeView<IRecentFile>;

let statusBarItem: vscode.StatusBarItem;
const statusBarItemText = '$(history) recent';

const statusBarItemTextChange = () => {
  const count = recentFiles.length;
  statusBarItem.text = `$(history) recent(${count})`;

  treeDataProvider?.refresh();
  treeDataExplorerProvider?.refresh();

  if (treeView) {
    // 显示数量
    treeView.badge = {
      value: count,
      tooltip: `共 ${count} 条`,
    };
  }
};

const changeRecentFiles = async (document: vscode.TextDocument) => {
  const activeTab: any = vscode.window.tabGroups.activeTabGroup.activeTab;
  // 排除 git 对比
  if (activeTab?.input?.uri?.scheme === 'file') {
    const uri = document.uri;

    const fsPath = uri.fsPath; // 完整文件路径
    // const fileName = document.fileName; // 文件名（含路径）
    const name = path.basename(fsPath);
    // console.log(fsPath, fileName, name);

    recentFiles = recentFiles.filter((item) => item.fsPath !== fsPath);

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    let workPath = '';
    if (workspaceFolder) {
      const rootPath = workspaceFolder.uri.fsPath;
      // console.log('当前文件的工作区根目录：', rootPath);
      workPath = rootPath === fsPath ? '' : fsPath.replace(rootPath, '').replace(/\\/g, '/');
    }

    recentFiles.unshift({ fsPath, label: name, workPath });
    statusBarItemTextChange();
    if (treeView && treeView.visible) {
      treeDataProvider.getTargetNode();
    }
    if (treeViewExplorer && treeViewExplorer.visible) {
      treeDataExplorerProvider.getTargetNode();
    }
  }
};

/** 清空记录 */
const clearRecentFiles = () => {
  recentFiles = [];
  statusBarItemTextChange();
};

/** 移除记录 */
const removeRecentFiles = (fsPath: string) => {
  recentFiles = recentFiles.filter((item) => item.fsPath !== fsPath);
  statusBarItemTextChange();
};

export class MyTreeDataProvider implements vscode.TreeDataProvider<IRecentFile> {
  // 数据变更事件（用于刷新）
  private _onDidChangeTreeData = new vscode.EventEmitter<IRecentFile | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  // 刷新视图
  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  // 返回节点的 TreeItem 渲染信息
  getTreeItem(element: IRecentFile): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(element.label);
    treeItem.iconPath = new vscode.ThemeIcon('file');
    treeItem.tooltip = element.fsPath;
    treeItem.description = element.workPath;
    // treeItem.command = element.command;
    return treeItem;
  }

  // 获取子节点（根节点时 element 为 undefined）
  getChildren(element?: IRecentFile): Thenable<IRecentFile[]> {
    if (element) {
      // 返回当前节点的子节点
      return Promise.resolve(recentFiles);
    } else {
      // 返回根节点数据（示例：静态结构）
      return Promise.resolve(recentFiles);
    }
  }
  private findNode(nodes?: IRecentFile[]): any {
    const currentNodes = nodes || recentFiles;
    for (const node of currentNodes) {
      // 匹配目标节点（可扩展更精准的匹配规则）
      if (node.fsPath === recentFiles[0].fsPath) {
        return node;
      }
      // 递归查找子节点
      // if (node.children && node.children.length > 0) {
      //   const found = this.findNode(node.children);
      //   if (found) {
      //     return found;
      //   }
      // }
    }
    return null;
  }
  getTargetNode() {
    treeView.reveal(this.findNode(), { focus: false, select: true });
    return this.findNode();
  }
  // 可选：获取父节点（用于拖拽等）
  getParent?(element: IRecentFile): Thenable<IRecentFile | undefined> {
    return Promise.resolve(undefined);
  }
}

export class MyTreeDataExplorerProvider implements vscode.TreeDataProvider<IRecentFile> {
  // 数据变更事件（用于刷新）
  private _onDidChangeTreeData = new vscode.EventEmitter<IRecentFile | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  // 刷新视图
  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  // 返回节点的 TreeItem 渲染信息
  getTreeItem(element: IRecentFile): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(element.label);
    treeItem.iconPath = new vscode.ThemeIcon('file');
    treeItem.tooltip = element.fsPath;
    treeItem.description = element.workPath;
    // treeItem.command = element.command;
    return treeItem;
  }

  // 获取子节点（根节点时 element 为 undefined）
  getChildren(element?: IRecentFile): Thenable<IRecentFile[]> {
    if (element) {
      // 返回当前节点的子节点
      return Promise.resolve(recentFiles);
    } else {
      // 返回根节点数据（示例：静态结构）
      return Promise.resolve(recentFiles);
    }
  }
  private findNode(nodes?: IRecentFile[]): any {
    const currentNodes = nodes || recentFiles;
    for (const node of currentNodes) {
      // 匹配目标节点（可扩展更精准的匹配规则）
      if (node.fsPath === recentFiles[0].fsPath) {
        return node;
      }
      // 递归查找子节点
      // if (node.children && node.children.length > 0) {
      //   const found = this.findNode(node.children);
      //   if (found) {
      //     return found;
      //   }
      // }
    }
    return null;
  }
  getTargetNode() {
    treeViewExplorer.reveal(this.findNode(), { focus: false, select: true });
    return this.findNode();
  }
  // 可选：获取父节点（用于拖拽等）
  getParent?(element: IRecentFile): Thenable<IRecentFile | undefined> {
    return Promise.resolve(undefined);
  }
}

export async function activate(context: vscode.ExtensionContext) {
  // ========== 1. 创建状态栏项 ==========
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left, // 位置：右侧（Left 为左侧）
    0, // 优先级（数值越大越靠右/左）
  );

  // ========== 2. 配置状态栏样式和内容 ==========

  const tooltip = new vscode.MarkdownString(
    `
## recent-files-vscode
    `,
    true,
  );

  tooltip.isTrusted = true;

  statusBarItem.tooltip = tooltip;
  statusBarItem.command = 'recent-files-vscode.clickStatusBar'; // 点击触发的命令
  statusBarItem.text = statusBarItemText;

  // ========== 3. 显示状态栏 ==========
  statusBarItem.show();

  const clickDisposable = vscode.commands.registerCommand('recent-files-vscode.clickStatusBar', () => {
    // 弹出带命令的快速选择菜单
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = 'recent-files-vscode';

    /** 更新快速选择菜单项 */
    const updateItems = () => {
      quickPick.items = recentFiles.map((el) => ({
        iconPath: new vscode.ThemeIcon('file'),
        label: el.label,
        description: el.fsPath,
        // detail: el.fsPath,
        buttons: [
          // { iconPath: new vscode.ThemeIcon('play'), tooltip: '运行' },
          { iconPath: new vscode.ThemeIcon('close'), tooltip: '删除记录' },
        ],
      }));
    };
    updateItems();

    // 标签栏添加按钮
    quickPick.buttons = [{ iconPath: new vscode.ThemeIcon('close'), tooltip: '清空记录' }];
    quickPick.onDidTriggerButton(async (button) => {
      // console.log(button);
      clearRecentFiles();
      updateItems();
    });

    quickPick.onDidTriggerItemButton((button) => {
      // console.log('onDidTriggerItemButton', button);
      if (button.button.tooltip === '删除记录') {
        const fsPath = button.item.description;
        if (fsPath && typeof fsPath === 'string') {
          removeRecentFiles(fsPath);
          updateItems();
        }
      }
    });

    quickPick.onDidChangeSelection(async (selection) => {
      if (selection[0]) {
        const fsPath = selection[0].description;
        if (typeof fsPath === 'string') {
          try {
            // 1. 把路径转成 VS Code 识别的 URI
            const uri = vscode.Uri.file(fsPath);
            // 2. 打开文件
            const document = await vscode.workspace.openTextDocument(uri);
            // 3. 在编辑器中显示（显示标签页）
            const editor = await vscode.window.showTextDocument(document);
          } catch (err) {}
        }
        quickPick.dispose();
      }
    });
    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
  });

  const activeEditor = vscode.window.activeTextEditor;

  // 1. 实例化数据提供者
  treeDataProvider = new MyTreeDataProvider();

  // 2. 创建 TreeView（推荐：可获取 TreeView 实例做更多操作）
  treeView = vscode.window.createTreeView('recentFiles', {
    treeDataProvider: treeDataProvider,
    showCollapseAll: true, // 显示“全部折叠”按钮
  });

  treeView.onDidChangeSelection(async (e) => {
    if (e.selection[0].fsPath) {
      const uri = vscode.Uri.file(e.selection[0].fsPath);
      // 2. 打开文件
      const document = await vscode.workspace.openTextDocument(uri);
      // 3. 在编辑器中显示（显示标签页）
      const editor = await vscode.window.showTextDocument(document);
    }
  });

  treeView.onDidChangeVisibility(async (e) => {
    if (e.visible) {
      treeDataProvider.getTargetNode();
    }
  });

  // 1. 实例化数据提供者
  treeDataExplorerProvider = new MyTreeDataExplorerProvider();

  // 2. 创建 TreeView（推荐：可获取 TreeView 实例做更多操作）
  treeViewExplorer = vscode.window.createTreeView('recentFilesExplorer', {
    treeDataProvider: treeDataExplorerProvider,
    showCollapseAll: true, // 显示“全部折叠”按钮
  });

  treeViewExplorer.onDidChangeSelection(async (e) => {
    if (e.selection[0].fsPath) {
      const uri = vscode.Uri.file(e.selection[0].fsPath);
      // 2. 打开文件
      const document = await vscode.workspace.openTextDocument(uri);
      // 3. 在编辑器中显示（显示标签页）
      const editor = await vscode.window.showTextDocument(document);
    }
  });

  treeViewExplorer.onDidChangeVisibility(async (e) => {
    if (e.visible) {
      treeDataExplorerProvider.getTargetNode();
    }
  });

  if (activeEditor) {
    changeRecentFiles(activeEditor.document);
  } else {
    // console.log('VSCode 启动时没有打开任何文件');
  }

  /* 监听切换标签 */
  const changeSub = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      changeRecentFiles(editor.document);
    }
  });

  const clearRecentFilesCommand = vscode.commands.registerCommand('recent-files-vscode.clearRecentFiles', () => {
    clearRecentFiles();
  });

  statusBarItemTextChange();
  context.subscriptions.push(clickDisposable, changeSub, treeView, clearRecentFilesCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
