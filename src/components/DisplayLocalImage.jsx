import React, { useState, useEffect, useCallback, memo } from 'react'
import { useRef } from 'react';

const fs = window.require('fs')

function DisplayLocalImage({ src, ...props }) {
    const [image, setImage] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    const imageRef = useRef(null)
    const observer = useRef(null)

    const loadUpImage = useCallback(() => {
        setIsLoading(true)
        fs.readFile(src, (error, data) => {
            if (error) return setError(error)
            const image = "data:image/png;base64," + data.toString('base64')
            setImage(image)
            setIsLoading(false)
            observer.current.disconnect()
        })
    }, [src])
    
    useEffect(() => {
        loadUpImage()
    }, [loadUpImage])

    useEffect(() => {
        if (observer.current) observer.current.disconnect()
        observer.current = new window.IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) loadUpImage()
        }, { root: null, rootMargin: '10px', threshold: 0.5 })

        const currentObserver = observer.current
        if (imageRef.current) {
            currentObserver.observe(imageRef.current)
        }
        return () => currentObserver.disconnect()
    }, [loadUpImage, src])

    if (isLoading) return <p>Loading...</p>
    if (error) return <div className="message is-danger">
        <p className="message-body">{error}</p>
    </div>
    return (
        <img ref={imageRef} alt={src} {...props} src={image} />
    )
}

export default DisplayLocalImage