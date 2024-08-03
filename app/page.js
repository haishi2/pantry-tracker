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
import Webcam from "react-webcam";

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [filter, setFilter] = useState("");
  const [itemsToDisplay, setItemsToDisplay] = useState([]);
  const webcamRef = useRef(null);

  // Update inventory list from Firestore
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

  // Remove an item from the inventory
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

  // Add an item to the inventory
  const addItem = async (item) => {
    const docRef = doc(collection(fireStore, "inventory"), item);
    const docSnap = await getDoc(docRef);
    let newImageURL;

    if (docSnap.exists()) {
      const { quantity, imageURL } = docSnap.data();

      await setDoc(docRef, {
        quantity: quantity + 1,
        imageURL: imageURL,
      });
    } else {
      if (imageFile) {
        const storageRef = ref(storage, `images/${item}.png`);

        await uploadBytes(storageRef, imageFile);

        newImageURL = await getDownloadURL(storageRef);
      } else {
        newImageURL = "";
      }
      await setDoc(docRef, { quantity: 1, imageURL: newImageURL });
    }

    setImageFile(null);
    await updateInventory();
  };

  // Handle file input change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  // Capture a photo from the webcam
  const handleTakePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => setImageFile(blob));
    }
  };

  // Update inventory on component mount
  useEffect(() => {
    updateInventory();
  }, []);

  // Filter items based on search input
  useEffect(() => {
    const filtered_items = inventory.filter((item) =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
    setItemsToDisplay(filtered_items);
  }, [filter, inventory]);

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
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap={2}
            >
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                width="100%"
                height={300}
                videoConstraints={{
                  facingMode: "user",
                }}
                style={{
                  width: "100%",
                  height: "300px",
                }}
              />
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
