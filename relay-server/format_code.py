import os

# 配置信息
PROJECT_NAME = "《羽毛球智能教学系统》"
OUTPUT_FILE = "作业代码汇总.txt"

# 定义需要读取的代码文件后缀名（可根据你的实际情况增删）
VALID_EXTENSIONS = {
    '.py', '.java', '.cpp', '.c', '.h', '.cs', 
    '.js', '.ts', '.html', '.css', '.vue', '.go', '.php'
}

# 定义需要忽略的文件夹（防止读取到依赖库、编译文件或隐藏文件夹）
IGNORE_DIRS = {'.git', '__pycache__', 'node_modules', '.idea', '.vscode', 'build', 'dist', 'venv', 'env'}

def generate_assignment_file():
    # 获取脚本文件自身所在的绝对路径（将其作为扫描的根目录）
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_filepath = os.path.join(base_dir, OUTPUT_FILE)
    
    processed_count = 0 
    print(f"开始递归扫描目录及其所有子文件夹: {base_dir}\n")
    
    with open(output_filepath, 'w', encoding='utf-8') as outfile:
        # os.walk 会自动递归遍历 base_dir 下的所有子文件夹
        for root, dirs, files in os.walk(base_dir):
            # 动态过滤掉不需要扫描的文件夹（修改 dirs 会影响 os.walk 的遍历）
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            for file in files:
                # 排除脚本自身和输出文件
                if file == os.path.basename(__file__) or file == OUTPUT_FILE:
                    continue

                ext = os.path.splitext(file)[1].lower()
                
                # 检查后缀名
                if ext in VALID_EXTENSIONS:
                    filepath = os.path.join(root, file)
                    # 获取相对于根目录的路径（例如输出 src/main.py 而不仅是 main.py）
                    rel_path = os.path.relpath(filepath, base_dir)
                    
                    code_content = ""
                    try:
                        with open(filepath, 'r', encoding='utf-8') as infile:
                            code_content = infile.read()
                    except UnicodeDecodeError:
                        # 如果 utf-8 失败，尝试用 gbk 编码读取（常见于 Windows 下的代码文件）
                        try:
                            with open(filepath, 'r', encoding='gbk') as infile:
                                code_content = infile.read()
                        except Exception as e:
                            print(f"❌ 无法读取文件 {rel_path}: {e}")
                            continue

                    # 按照作业要求拼接格式
                    formatted_text = f"1、项目名称：{PROJECT_NAME}\n"
                    # 这里填入包含子文件夹的相对路径，结构更清晰
                    formatted_text += f"2、代码所属文件名：{rel_path}\n"
                    formatted_text += f"3、功能：【请手动填写】\n"
                    formatted_text += f"4、代码（关键变量、函数需附简单的注释）：\n"
                    formatted_text += f"{code_content}\n"
                    formatted_text += "\n" + "="*60 + "\n\n"

                    outfile.write(formatted_text)
                    processed_count += 1
                    print(f"✅ 已处理: {rel_path}")

    print(f"\n🎉 处理完成！共从各级文件夹中提取了 {processed_count} 个代码文件。")
    print(f"📄 格式化后的代码已保存至: {output_filepath}")

if __name__ == '__main__':
    generate_assignment_file()