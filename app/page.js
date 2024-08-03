"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { fireStore, storage } from "@/firebase";
import {
  Box,
  Modal,
  Typography,
  Stack,
  TextField,
  Button,
  Grid,
} from "@mui/material";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import "blueimp-canvas-to-blob";

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [filter, setFilter] = useState("");
  const [itemsToDisplay, setItemsToDisplay] = useState([]);
  const [cameraAccess, setCameraAccess] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const checkAndRequestCameraPermission = async () => {
    if (
      typeof window !== "undefined" &&
      navigator?.mediaDevices?.getUserMedia
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraAccess(true);
      } catch (error) {
        console.error("Camera access denied or error occurred:", error);
        setCameraAccess(false);
      }
    } else {
      setCameraAccess(false);
    }
  };

  const updateInventory = async () => {
    const snapshot = query(collection(fireStore, "inventory"));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(fireStore, "inventory"), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity, imageURL } = docSnap.data();

      if (quantity === 1) {
        if (imageURL) {
          const imageRef = ref(storage, imageURL);

          try {
            await deleteObject(imageRef);
            console.log("Image deleted successfully");
          } catch (error) {
            console.error("Error deleting image: ", error);
          }
        }
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1, imageURL });
      }
    }

    await updateInventory();
  };

  const addItem = async (item) => {
    const docRef = doc(collection(fireStore, "inventory"), item);
    const docSnap = await getDoc(docRef);
    let imageURL;

    if (docSnap.exists()) {
      const { quantity, imageURL } = docSnap.data();

      await setDoc(docRef, { quantity: quantity + 1, imageURL });
    } else {
      if (imageFile) {
        const storageRef = ref(storage, `images/${item}.png`);

        await uploadBytes(storageRef, imageFile);

        imageURL = await getDownloadURL(storageRef);
      } else {
        imageURL = "";
      }
      await setDoc(docRef, { quantity: 1, imageURL });
    }

    setImageFile(null);
    await updateInventory();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        setImageFile(blob);
      }, "image/png");
    }
  };

  useEffect(() => {
    updateInventory();
  }, []);

  useEffect(() => {
    const filtered_items = inventory.filter((item) =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
    setItemsToDisplay(filtered_items);
  }, [filter, inventory]);

  useEffect(() => {
    checkAndRequestCameraPermission();
  }, [open]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="start"
      alignItems="center"
      gap={2}
      sx={{ backgroundColor: "#0D0D0D" }}
    >
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          sx={{
            transform: "translate(-50%, -50%)",
            width: "50%",
            height: "50%",
            bgcolor: "#301934",
            color: "#E5E5E5",
            border: "2px solid #7B4E8C",
            boxShadow: 24,
            p: 4,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Typography variant="h6" sx={{ color: "#E5E5E5" }}>
            Add Item
          </Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
              variant="outlined"
              label="Item Name"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#A8A8A8",
                  },
                  "&:hover fieldset": {
                    borderColor: "#7B4E8C",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#7B4E8C",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "#A8A8A8",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#7B4E8C",
                },
                input: {
                  color: "#E5E5E5",
                },
              }}
            />
            <Button
              variant="contained"
              onClick={() => {
                addItem(itemName);
                setItemName("");
                setOpen(false);
              }}
              sx={{
                backgroundColor: "#5A375B",
                color: "#E5E5E5",
                "&:hover": {
                  backgroundColor: "#301934",
                },
              }}
            >
              Add
            </Button>
          </Stack>
          <Stack width="100%" direction="column" spacing={2}>
            <p>Most recent image will be used</p>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {cameraAccess === true && (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                gap={2}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: "100%",
                    height: "300px",
                  }}
                />

                <canvas ref={canvasRef} style={{ display: "none" }} />

                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#5A375B",
                    color: "#E5E5E5",
                    "&:hover": {
                      backgroundColor: "#301934",
                    },
                  }}
                  onClick={handleTakePhoto}
                >
                  Take photo
                </Button>
              </Box>
            )}
            {cameraAccess === false && (
              <Typography color="#A8A8A8">
                Camera access is not granted. Please enable it to use this
                feature.
              </Typography>
            )}
          </Stack>
        </Box>
      </Modal>
      <Box
        display="flex"
        gap={5}
        width="100%"
        height="8%"
        alignItems="center"
        justifyContent="center"
      >
        <Button
          variant="contained"
          onClick={() => {
            setOpen(true);
          }}
          sx={{
            backgroundColor: "#301934",
            color: "#E5E5E5",
            "&:hover": {
              backgroundColor: "#5A375B",
            },
          }}
        >
          Add New Item
        </Button>
        <TextField
          label="Item Name"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search for an item"
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#A8A8A8",
              },
              "&:hover fieldset": {
                borderColor: "#7B4E8C",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#7B4E8C",
              },
            },
            "& .MuiInputLabel-root": {
              color: "#A8A8A8",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#7B4E8C",
            },
            input: {
              color: "#E5E5E5",
            },
          }}
        />
      </Box>

      <Box height="92%" width="102%">
        <Box
          width="100%"
          height="8%"
          bgcolor="#301934"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="h2" color="#E5E5E5">
            Items
          </Typography>
        </Box>
        <Grid
          container
          width="100%"
          height="90%"
          spacing={2}
          overflow="auto"
          padding={2}
        >
          {itemsToDisplay.map(({ name, quantity, imageURL }) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              lg={3}
              key={name}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="flex-start"
              bgcolor="#5A375B"
              border="1px solid #7B4E8C"
              padding={5}
              gap={2}
              sx={{ height: "50%", width: "25%" }}
            >
              <Box height="20%">
                <Typography variant="h4" color="#E5E5E5" textAlign="center">
                  {name.charAt(0).toUpperCase() +
                    name.slice(1) +
                    ", Quantity: " +
                    quantity}
                </Typography>
              </Box>

              <Box width="70%" height="50%">
                {imageURL ? (
                  <Image
                    src={imageURL}
                    alt={name}
                    width={1920}
                    height={1080}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: "4px",
                    }}
                  />
                ) : (
                  <Typography color="#A8A8A8">No Image</Typography>
                )}
              </Box>
              <Box
                height="30%"
                width="100%"
                display="flex"
                alignItems="center"
                justifyContent="space-evenly"
              >
                <Button
                  variant="contained"
                  onClick={() => {
                    addItem(name);
                  }}
                  sx={{
                    backgroundColor: "#301934",
                    color: "#E5E5E5",
                    "&:hover": {
                      backgroundColor: "#5A375B",
                    },
                  }}
                >
                  Add
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    removeItem(name);
                  }}
                  sx={{
                    backgroundColor: "#301934",
                    color: "#E5E5E5",
                    "&:hover": {
                      backgroundColor: "#5A375B",
                    },
                  }}
                >
                  Remove
                </Button>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
