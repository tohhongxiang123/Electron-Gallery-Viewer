import React, { useState, useEffect } from 'react'
import styles from './ImageViewer.module.scss'

const electron = window.require('electron')
const ipcRenderer = electron.ipcRenderer
const fs = window.require('fs')

export default function ImageViewer() {
    const [image, setImage] = useState(null)
    const [images, setImages] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [currentFileIndex, setCurrentFileIndex] = useState(0)

    useEffect(() => {
        ipcRenderer.on('select-file', (event, image) => {
            console.log(image)
            setImage(image)
        })

        ipcRenderer.on('select-folder', (event, directory) => {
            setCurrentFileIndex(0)

            fs.readdir(directory, (err, files) => {
                const absolutePathFiles = files.map(file => `${directory}/${file}`)
                console.log({ absolutePathFiles })
                setImages(absolutePathFiles)
            })
        })
    }, [])

    useEffect(() => {
        const currentFile = images[currentFileIndex]
        if (!currentFile) return

        setIsLoading(true)
        const selectedFile = fs.readFile(currentFile.toString(), (err, data) => {
            const image = "data:image/png;base64," + data.toString('base64')
            setImage(image)
            setIsLoading(false)
        })
        setImage(selectedFile)
    }, [currentFileIndex, images])

    const handleImageChange = (direction) => {
        setCurrentFileIndex(c => ((c + direction) % images.length) > 0 ? (c + direction) % images.length : ((c + direction) % images.length) + images.length)
    }

    const selectRandomImage = () => {
        const randomIndex = Math.floor(Math.random()*images.length)
        setCurrentFileIndex(randomIndex)
    }

    useEffect(() => {
        function handleKeyDown(e) {
            switch(e.code) {
                case "Space":
                    return selectRandomImage()
                case "ArrowLeft":
                    return handleImageChange(-1)
                case "ArrowRight":
                    return handleImageChange(1)
                default:
                    return
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    })

    return (
        <div className={styles.root}>
            <div className={styles.gallery}>
                {isLoading ?
                    <p>Loading...</p> :
                    image ?
                        <img src={image} alt="" style={{ maxWidth: '100%', maxHeight: '100%' }} /> :
                        <p><em>No image selected</em></p>
                }
            </div>
            <div className={styles.footer}>
                <button onClick={() => handleImageChange(-1)}>Previous</button>
                {images[currentFileIndex] && <p>{images[currentFileIndex]}</p>}
                <button onClick={() => handleImageChange(1)}>Next</button>
                <button onClick={selectRandomImage}>Shuffle</button>
            </div>
        </div>
    )
}