import FileSystem from "fs";

export const fetchAndSaveImage = async (url: string, path: string, distPath: string = ""): Promise<boolean> => {
    FileSystem.mkdirSync(path.substring(0, path.lastIndexOf("/")), { recursive: true });
    const logo = await fetch(url);
    const data = await logo.arrayBuffer();
    FileSystem.writeFileSync(path, Buffer.from(data));

    if (distPath != "") {
        //copy to dist
        FileSystem.mkdirSync(distPath.substring(0, distPath.lastIndexOf("/")), { recursive: true });
        FileSystem.copyFileSync(path, distPath);
    }
    return true;
}