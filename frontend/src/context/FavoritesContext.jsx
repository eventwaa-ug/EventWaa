import { createContext, useContext, useState, useEffect } from "react";


const FavoritesContext = createContext();


export function FavoritesProvider({ children }) {


    const [favorites, setFavorites] = useState(() => {

        const savedFavorites = localStorage.getItem("favorites");

        return savedFavorites 
            ? JSON.parse(savedFavorites) 
            : [];

    });



    useEffect(() => {

        localStorage.setItem(
            "favorites",
            JSON.stringify(favorites)
        );

    }, [favorites]);



    const addFavorite = (event) => {

    setFavorites((prevFavorites) => {

        const alreadyFavorite = prevFavorites.some(
            (item) => item.id === event.id
        );


        if (alreadyFavorite) {
            return prevFavorites;
        }


        return [
            ...prevFavorites,
            event
        ];

    });

};



    const removeFavorite = (id) => {

        setFavorites((prevFavorites) =>

            prevFavorites.filter(
                (event) => event.id !== id
            )

        );

    };



    const isFavorite = (id) => {

        return favorites.some(
            (event) => event.id === id
        );

    };



    return (

        <FavoritesContext.Provider

            value={{
                favorites,
                addFavorite,
                removeFavorite,
                isFavorite,
            }}

        >

            {children}

        </FavoritesContext.Provider>

    );

}



export function useFavorites() {

    return useContext(FavoritesContext);

}