# for .gom files in examples directory
for file in examples/*.gom; do
    echo "Compiling $file"
    npm run compile examples/"$(basename "$file")" llvm
done