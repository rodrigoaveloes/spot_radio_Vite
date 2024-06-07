// import React, { useState } from "react";
// import { writeFile, BaseDirectory } from "@tauri-apps/api/fs";
// import { dialog } from "@tauri-apps/api";

// export const MP3ToFile = () => {
//   const [fileContent, setFileContent] = useState(null);
//   const [fileName, setFileName] = useState("");

//   const handleSave = async () => {
//     try {
//       const result = await dialog.save({
//         defaultPath: fileName,
//         filters: [{ name: "MP3 Files", extensions: ["mp3"] }],
//       });
//       if (result) {
//         const path = result.path;
//         await writeFile(path, fileContent);
//         alert("File saved successfully!");
//       }
//     } catch (error) {
//       console.error("Error saving file:", error);
//     }
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     setFileContent(file);
//     setFileName(file.name);
//   };

//   return (
//     <div>
//       <h1>Save MP3 File Example</h1>
//       <input type="file" accept=".mp3" onChange={handleFileChange} />
//       <button onClick={handleSave}>Save MP3 File</button>
//     </div>
//   );
// };
