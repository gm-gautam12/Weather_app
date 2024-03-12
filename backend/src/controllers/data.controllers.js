import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import axios from "axios";


let weatherData = [];

const fetchWeatherData = asyncHandler(async(req,res) => {

    try {
        const response = await axios.get("https://api.weatherapi.com/v1/current.json?key=192e3aaf21ff4c0eaab95337240503&q=durgapur&aqi=no");
        weatherData = response.data;
        console.log(weatherData);
    } catch (error) {
        throw new ApiError(500,"something went wrong while fetching data while api call");
    }

})

fetchWeatherData();

const interval = 60*60*1000;
setInterval(fetchWeatherData, interval);

const formatWeatherData = asyncHandler(async(req,res)=>{

    try {
        
        const formattedRespone = {
            cities: weatherData.map(city => ({
                name: city.name,
                country: city.country,
                temperature: city.temperature,
                humidity: city.humidity,
                condition: city.condition,
                icon_url: city.icon_url
            }))
        }

        res.status(200).json(
            new ApiResponse(200,formattedRespone,"weather data fetched successfully")
        )

    } catch (error) {
       throw new ApiError(500,"something went wrong while formatting data");
    }
})


export {fetchWeatherData,formatWeatherData};