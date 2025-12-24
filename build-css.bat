@echo off
echo Building Tailwind CSS...
npx tailwindcss -i ./frontend/css/input.css -o ./frontend/css/tailwind.css --minify
echo Tailwind CSS built successfully!