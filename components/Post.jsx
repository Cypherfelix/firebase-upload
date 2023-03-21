import React, { useState } from 'react'
import { toast, ToastContainer } from 'react-toastify';
import { storage, db } from '../Firebase/config'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { addDoc, collection } from 'firebase/firestore/lite';

const Post = () => {

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [postError, setPostError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);



  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const types = ['image/png', 'image/jpeg', 'image/jpg']

  const changeHandler = (e) => {
    let selected = e.target.files[0];

    if (selected && types.includes(selected.type)) {
      setFile(selected);
      setError('')
    } else {
      setFile(null);
      setError(toast.error('Please select an image file (png or jpeg)'))
    }
  }

  const handleAddProducts = async (e) => {
    setSubmitting(true);
    e.preventDefault();

    try {
      // Validate file size
      const fileSize = file.size / (1024 * 1024); // Convert bytes to megabytes
      if (fileSize > 5) {
        toast.error("File size must be less than 5MB");
        return;
      }

      // // Validate file type (optional)
      // const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      // if (!allowedTypes.includes(file.type)) {
      //   toast.error("Invalid file type. Please upload a JPEG, PNG, or PDF file");
      //   return;
      // }


      const storageRef = ref(storage, `/files/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      try {
        // Show progress bar while uploading
        uploadTask.on("state_changed", (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(progress);
        });

        // Wait for upload to finish and get download URL
        const snapshot = await uploadTask;
        const url = await getDownloadURL(uploadTask.snapshot.ref);

        // Add product to Firestore
        const productData = {
          title,
          price: Number(price),
          description,
          imageUrl: url,
        };
        const docRef = await addDoc(collection(db, "products"), productData);
        console.log("Document written with ID: ", docRef.id);
        console.log("File uploaded successfully");
        console.log(url);
        toast.success("Product added successfully");
      } catch (error) {
        toast.error("Error adding product");
        console.error("Error adding product: ", error);
      }


    } catch (error) {
      setPostError(error.message)
    }
    setSubmitting(false);
  };

  return (
    <>
      <ToastContainer />
      <div className="bg-gray-200 h-screen flex justify-center items-center">
        <div className='bg-white rounded-xl px-7 shadow-lg p-8 text-black relative w-1/2'>
          <form onSubmit={handleAddProducts} className='flex flex-col space-y-3 max-w-4xl'>
            <div>
              <h1 className='font-bold text-2xl'>Post an Ad</h1>
            </div>
            <div>
              <label>Product Name</label>
              <input type='text' onChange={(e) => setTitle(e.target.value)} value={title} className='ring-1 ring-gray-300 w-full rounded-md pl-6  py-2 mt-2 outline-none focus:ring-2 focus:ring-rose-300' required />
            </div>
            <div>
              <label>Price</label>
              <input type='number' onChange={(e) => setPrice(e.target.value)} value={price} className='ring-1 ring-gray-300 w-full rounded-md pl-6  py-2 mt-2 outline-none focus:ring-2 focus:ring-rose-300' required />
            </div>
            <div>
              <label>Desciption</label>
              <textarea type='text' onChange={(e) => setDescription(e.target.value)} value={description} className='ring-1 ring-gray-300 w-full rounded-md py-2 mt-2 outline-none focus:ring-2 focus:ring-rose-300' rows="4" name='message' placeholder='Type here...' />
            </div>
            <div>
              <label className='text-md'>Select image</label>
              <input type='file' id='file' accept="image/*" onChange={changeHandler} className='ring-1 ring-gray-300 w-full rounded-md pl-6  py-2 mt-2 outline-none focus:ring-2 focus:ring-rose-300' required />
            </div>

            <div>
              {progress > 0 && progress < 100 && (
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-rose-200">
                    <div
                      style={{ width: `${progress}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-rose-500"
                    ></div>
                  </div>
                </div>
              )}
            </div>
            {error && <div>{error}</div>}
            {file && <div>{file.name}</div>}
            {postError && <div>{postError}</div>}
            <div />
            <button
              type='submit'
              disabled={!file || progress > 0 || submitting}
              className={`inline-block self-center bg-red-500 text-white font-bold rounded-lg px-6 py-2 uppercase text-sm ${!file || progress > 0 || submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {submitting ? 'Posting...' : progress > 0 ? `Uploading ${progress}%` : 'Post'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default Post