export const LOGO_MAX_BYTES=1024*1024;
export function logoFileError(file){
 if(!file)return '';
 if(!['image/png','image/jpeg'].includes(file.type))return 'Choose a PNG or JPG image for your logo.';
 if(file.size>LOGO_MAX_BYTES)return 'Your logo is too large. Choose an image smaller than 1 MB.';
 if(!file.size)return 'This image is empty. Choose another logo.';
 return '';
}
export async function readLogoFile(file){
 const error=logoFileError(file);if(error)throw new Error(error);
 const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('The logo could not be read. Please choose the file again.'));reader.onabort=()=>reject(new Error('Logo upload was cancelled.'));reader.readAsDataURL(file)});
 const image=new Image();image.src=data;
 try{await image.decode()}catch{throw new Error('This file is not a readable image. Choose another PNG or JPG.');}
 if(!image.naturalWidth||!image.naturalHeight)throw new Error('The logo image has no visible dimensions.');
 return data;
}
