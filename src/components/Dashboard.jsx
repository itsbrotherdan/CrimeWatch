import Timeline from './Timeline';
import Map from './Map';
import Charts from './Charts';
import Form from './Form';
import '../app.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useState } from "react";
const axios = require('axios');

const Dashboard = () => {

  const [reports, setReports] = useState([])
  const [mappedReports, setMappedReports] = useState([])
  const [zipcode, setZipcode] = useState(null)



  function getReports(event) {
    event.preventDefault();
    axios.get(`https://data.nola.gov/resource/pc5d-tvaw.json?$where=TimeCreate between '2023-03-22T00:00:00' and '2023-03-23T23:59:59' and zip = '${zipcode}'`
    )
      .then((response) => {
        setReports(response)
        return response.data.map((ele) => {
          return {
            incident_type: ele.typetext, //typetext
            address: ele.block_address, //blockaddress
            lat: ele.location.coordinates[1], //location.coordinates[1]
            long: ele.location.coordinates[0], //location.coordinates[0]
            time: ele.timecreate, //timecreate
            zip: ele.zip, //zip
            disposition: ele.dispositiontext, //initialtypetext
            user_submitted: false
          };
        })
      })
      .then((mapped) => {
        axios.get('/api/reports/')
          .then((dbReports) => {
            let promises = dbReports.data.map((ele) => {
              return axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=' + ${ele.address} + ' ' + ${ele.city} + ' ' + ${ele.state} ' ' + ${ele.zipcode} + '&key=AIzaSyDNNEUdVHdTmB5zCTXDV_Y4p9dPMZl00rk`)
                .then((res) => {
                  let outpObj = {
                    incident_type: ele.incident_type, //incident_type
                    address: ele.address, //address
                    lat: res.data.results[0].geometry.location.lat,
                    long: res.data.results[0].geometry.location.lng,
                    time: ele.createdAt, //createdAt
                    zip: ele.zipcode, //zipcode
                    description: ele.description, //description
                    user_submitted: true
                  };
                  return outpObj;
                })
                .catch((err) => {
                  console.error(err);
                });
            });
            return Promise.all(promises);
          })
          .then((mappedDb) => {
            let newMappedReports = [];
            mapped.forEach((ele) => {
              newMappedReports.push(ele);
            });
            mappedDb.forEach((ele) => {
              newMappedReports.push(ele);
            });
            return newMappedReports;
          })
          .then((newState) => {
            setMappedReports(newState);
          })
          .catch((err) => {
            console.error(err);
          })
      })
      .catch((err) => {
        console.error(err);
      });
  }

  function updateZip(event) {
    setZipcode(event.target.value)
  }

  return (
    <div className='container'>
      <div className='form'>
        <h2>Enter Zipcode</h2>
        <form>
          <input type="text" onChange={updateZip} />
          <input type="submit" onClick={getReports} />
        </form>
      </div>
      <Map reports={reports} zipcode={zipcode} />
      <Timeline reports={mappedReports} />
      <Charts mappedReports={mappedReports} />
      <Form />
    </div>
  )
}

export default Dashboard;