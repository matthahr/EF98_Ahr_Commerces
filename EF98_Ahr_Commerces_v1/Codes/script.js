

// Création de la carte
var map = L.map('map').setView([48.8588339014961, 2.3494069513342044], 12);

// Désactiver le défilement et le zoom sur la carte
map.dragging.disable();
map.scrollWheelZoom.disable();

// Supprimer les boutons de zoom et de dézoom
map.removeControl(map.zoomControl);

// Déclaration et ajout du fond de carte
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


// Ajouter le GeoJSON à la carte
// const geojsonLayerArrdt = L.geoJSON(arrondissements).addTo(map);
// const geojsonLayerQuartier = L.geoJSON(quartiers_paris).addTo(map);

const geojsonLayerArrdt = L.geoJSON(arrondissements);
const geojsonLayerQuartier = L.geoJSON(quartiers_paris);

const url_commerces = "https://opendata.paris.fr/api/records/1.0/search/?dataset=coronavirus-commercants-parisiens-livraison-a-domicile&q=&rows=2503";




fetch(url_commerces)
.then(result => result.json()) 
.then(result => {
    //console.log(result.records);

    // Calcul selon le pourcentage à paris
    var densite_comm_arrdt = {};

    var densite_comm_boulangerie_arrdt = {};
    var densite_comm_restaurant_arrdt = {};
    var densite_comm_librairie_arrdt = {};
    
    // Calcul selon la densité surfacique
    var densite_surf_arrdt = {};

    var densite_surf_boulangerie_arrdt = {};
    var densite_surf_restaurant_arrdt = {};
    var densite_surf_librairie_arrdt = {};


    // On parcours chaque arrdt/quartiers
    for (var i = 0; i < 20; i++) {

        // compteurs pour calculer les ratios
        var compteur_in = 0;
        var compteur_total = 0;

        var compteur_in_boulangerie = 0;
        var compteur_total_boulangerie = 0;

        var compteur_in_restaurant = 0;
        var compteur_total_restaurant = 0;

        var compteur_in_librairie = 0;
        var compteur_total_librairie = 0;
        

        var geom_arrondissement = arrondissements[0].features[i].geometry.coordinates[0];
        var num_arrondissement = arrondissements[0].features[i].properties.c_ar;

        // Initialisation du polygone et savoir si le point est dedans ou pas.
        var polygon_arr = turf.polygon([geom_arrondissement]);

        // Calcul de la surface des arrondissements
        var surface = turf.area(polygon_arr);
        

        // On parcours chaque commerces
        for (let elem in result.records){

            var categorie = result.records[elem].fields.type_de_commerce;
          
            // Recuperation des coordonnées des commerces
            var lat = result.records[elem].geometry.coordinates[0];
            var long = result.records[elem].geometry.coordinates[1];
            var coords = [long,lat];
            var coords_turf = [lat,long];
            var m = L.marker(coords);
    
            var point_turf = turf.point(coords_turf);

            var isInside = turf.booleanPointInPolygon(point_turf, polygon_arr);

            if (categorie == "Boulangerie - pâtisserie"){
              compteur_total_boulangerie +=1;

              if (isInside){
                compteur_in_boulangerie += 1;
                }

            }

            else if (categorie == "Restaurant ou traiteur"){
              compteur_total_restaurant +=1;

              if (isInside){
                compteur_in_restaurant += 1;
                }
            }

            else if (categorie == "Librairie"){
              compteur_total_librairie +=1;

              if (isInside){
                compteur_in_librairie += 1;
                }
            }

            if (isInside){
                compteur_in += 1;
                }
                
            compteur_total += 1;
        }


        
        var ratio = compteur_in/compteur_total;
        var ratio_surf = compteur_in/surface;

        var ratio_boulangerie = compteur_in_boulangerie/compteur_total_boulangerie;
        var ratio_surf_boulangerie = compteur_in_boulangerie/surface;

        var ratio_restaurant = compteur_in_restaurant/compteur_total_restaurant;
        var ratio_surf_restaurant = compteur_in_restaurant/surface;

        var ratio_librairie = compteur_in_librairie/compteur_total_librairie;
        var ratio_surf_librairie = compteur_in_librairie/surface;

        
        densite_comm_boulangerie_arrdt[num_arrondissement] = ratio_boulangerie;
        densite_surf_boulangerie_arrdt[num_arrondissement] = ratio_surf_boulangerie;

        densite_comm_restaurant_arrdt[num_arrondissement] = ratio_restaurant;
        densite_surf_restaurant_arrdt[num_arrondissement] = ratio_surf_restaurant;

        densite_comm_librairie_arrdt[num_arrondissement] = ratio_librairie;
        densite_surf_librairie_arrdt[num_arrondissement] = ratio_surf_librairie;

        densite_comm_arrdt[num_arrondissement] = ratio;
        densite_surf_arrdt[num_arrondissement] = ratio_surf;

        
            
    }   

    function getQuantileColor(value, ratios) {
      /**
       * Affecte une couleur à un élément de maille territoriale selon la valeur du ratio qui lui est attribué
       *
       * @param {float} value - Valeur du ratio.
       * @param {dictionnaire} ratios - Dictionnaire qui affecte à une maille une valeur de ratio.
       * @returns {string} La couleur affectée à l'élément de la maille
      */
      
      const ratioArray = Object.values(ratios);
      
      // On trie l'array
      ratioArray.sort((a, b) => a - b);
      
      // Calcul des quantiles
      const quantiles = [];
      const numQuantiles = 5;
      for (let i = 1; i < numQuantiles; i++) {
        const quantile = ratioArray[Math.floor(i * ratioArray.length / numQuantiles)];
        quantiles.push(quantile);
      }

      // Création de la légende
      var legend = document.getElementById('legend');
      
      // Création de la légende pour la statistique de densité surfacique
      if (ratios == densite_surf_arrdt || ratios == densite_surf_boulangerie_arrdt || ratios == densite_surf_restaurant_arrdt || ratios == densite_surf_librairie_arrdt){
        legend.innerHTML = '<h4>Densité surfacique par km2 du commerce dans la maille territoriale</h4>' +
                            '<div class="row">'+
                              '<div class="col-3">'+
                                '<span style="background-color: #ffffb2"></span>'+ '< ' + (quantiles[0] * 1000000).toFixed(1) +
                              '</div>'+
                              '<div class="col-3">'+
                                '<span style="background-color: #fecc5c"></span>' + (quantiles[0] * 1000000).toFixed(1) +' - ' +(quantiles[1] * 1000000).toFixed(1) +
                              '</div>' +
                              '<div class="col-3">' +
                                '<span style="background-color: #fd8d3c"></span>' + (quantiles[1] * 1000000).toFixed(1) +' - ' +(quantiles[2] * 1000000).toFixed(1)+
                              '</div>'+
                              '<div class="col-3">'+
                                '<span style="background-color: #f03b20"></span>' + (quantiles[2] * 1000000).toFixed(1) +' - ' +(quantiles[3] * 1000000).toFixed(1)+
                              '</div>' +
                              '<div class="col-3">' +
                                '<span style="background-color: #bd0026"></span>' + '> ' + (quantiles[3] * 1000000).toFixed(1)+
                              '</div>' +
                            '</div>';
      }
      // Création de la légende pour la statistique de part de l'arrdt dans Paris
      else{
        legend.innerHTML = '<h4>Part du commerce dans Paris en % </h4>' +
                            '<div class="row">'+
                              '<div class="col-3">'+
                                '<span style="background-color: #ffffb2"></span>'+ '< ' + (quantiles[0] * 100).toFixed(1) +
                              '</div>'+
                              '<div class="col-3">'+
                                '<span style="background-color: #fecc5c"></span>' + (quantiles[0] * 100).toFixed(1) +' - ' +(quantiles[1] * 100).toFixed(1) +
                              '</div>' +
                              '<div class="col-3">' +
                                '<span style="background-color: #fd8d3c"></span>' + (quantiles[1] * 100).toFixed(1) +' - ' +(quantiles[2] * 100).toFixed(1) +
                              '</div>'+
                              '<div class="col-3">'+
                                '<span style="background-color: #f03b20"></span>' + (quantiles[2] * 100).toFixed(1) +' - ' +(quantiles[3] * 100).toFixed(1) +
                              '</div>' +
                              '<div class="col-3">' +
                                '<span style="background-color: #bd0026"></span>' + '> ' + (quantiles[3] * 100).toFixed(1) +
                              '</div>' +
                            '</div>';
      }

      // Assigner une couleur à chaque quantiles (couleurs d'un simple gradation jaune rouge)
      if (value <= quantiles[0]) {
        return "#ffffb2";
      } else if (value <= quantiles[1]) {
        return "#fecc5c";
      } else if (value <= quantiles[2]) {
        return "#fd8d3c";
      } else if (value <= quantiles[3]) {
        return "#f03b20";
      } else {
        return "#bd0026";
      }


    }



    // function affichage_arrdt(dico_ratio) {
    //   //Affichage choroplète par arrondissements

    //   for(i = 0; i < 20; i++){
    //     var num_arr = i.toString();
    //     console.log("num arr : ",num_arr);
    //     var couleur = getQuantileColor(dico_ratio[num_arr], dico_ratio);
    //     console.log("couleur : ",couleur);
    //     
    //     L.geoJson(arrondissements, {
    //         style:
    //           {color: couleur,
    //           fillColor: couleur,
    //           weight: 1,
    //           fillOpacity: 1}
    //     }).addTo(map) 
    //   }
    // }

    // affichage_arrdt(densite_surf_boulangerie_arrdt);

    
    
    function affichage_choro(dico_ratio) {

     /**
       * Affiche les arrondissements à partir de la couleur calculée dans la fonction getQuantileColor
       *
       * @param {dictionnaire} dico_ratio - Dictionnaire qui affecte à une maille une valeur de ratio.
       * @returns {style} Le style affecté à l'arrondissement et ajoute le dit arrondissement sur la carte leaflet.
      */
    
    //Affichage choroplète par arrondissements
    L.geoJson(arrondissements, {
        style: function(feature) {
          switch (feature.properties.c_ar) {
            case 1:
              // associer la couleur de choroplete en fonction de la valeur du ratio                       
              var couleur_1 = getQuantileColor(dico_ratio["1"], dico_ratio)
              
              return {
                color: "#000000",
                fillColor: couleur_1,
                weight: 1,
                fillOpacity: 1
              };
            case 2:
              var couleur_2 = getQuantileColor(dico_ratio["2"], dico_ratio)
              return {
                color:"#000000",
                fillColor: couleur_2,
                weight: 1,
                fillOpacity: 1
              };

            case 3:
              var couleur_3 = getQuantileColor(dico_ratio["3"], dico_ratio)
              return {
                color:"#000000",
                fillColor: couleur_3,
                weight: 1,
                fillOpacity: 1
              };


            case 4:
              var couleur_4 = getQuantileColor(dico_ratio["4"], dico_ratio)
              return {
                color:"#000000",
                fillColor: couleur_4,
                weight: 1,
                fillOpacity: 1
              };

            case 5:
              var couleur_5 = getQuantileColor(dico_ratio["5"], dico_ratio)
              return {
                color:"#000000",
                fillColor: couleur_5,
                weight: 1,
                fillOpacity: 1
              };

            case 6:
              var couleur_6 = getQuantileColor(dico_ratio["6"], dico_ratio)
              return {
                color:"#000000",
                fillColor: couleur_6,
                weight: 1,
                fillOpacity: 1
              };

            case 7:
              var couleur_7 = getQuantileColor(dico_ratio["7"], dico_ratio)
              return {
                color:"#000000",
                fillColor: couleur_7,
                weight: 1,
                fillOpacity: 1};

            case 8:
              var couleur_8 = getQuantileColor(dico_ratio["8"], dico_ratio)
              return {
                color:"#000000",
                fillColor: couleur_8,
                weight: 1,
                fillOpacity: 1
              };

            case 9:
              var couleur_9 = getQuantileColor(dico_ratio["9"], dico_ratio)
              return {
                color:"#000000",
                fillColor: couleur_9,
                weight: 1,
                fillOpacity: 1
              };

            case 10:
              var couleur_10 = getQuantileColor(dico_ratio["10"], dico_ratio)
              return {
                color: "#000000",
                fillColor: couleur_10,
                weight: 1,
                fillOpacity: 1
              };

            case 18:
              var couleur_18 = getQuantileColor(dico_ratio["18"], dico_ratio)
              return {
                color: "#000000",
                fillColor: couleur_18,
                weight: 1,
                fillOpacity: 1
              };

            case 11:
              var couleur_11 = getQuantileColor(dico_ratio["11"], dico_ratio)
              return {
                color: "#000000",
                fillColor: couleur_11,
                weight: 1,
                fillOpacity: 1
              };
                    
            case 12:
              var couleur_12 = getQuantileColor(dico_ratio["12"], dico_ratio)
              return {
                color: "#000000",
                fillColor: couleur_12,
                weight: 1,
                fillOpacity: 1};

            case 13:
              var couleur_13 = getQuantileColor(dico_ratio["13"], dico_ratio)
              return {
                color: "#000000",
                fillColor: couleur_13,
                weight: 1,
                fillOpacity: 1};

            case 14:
              var couleur_14 = getQuantileColor(dico_ratio["14"], dico_ratio)
              return {
                color: "#000000",
                fillColor: couleur_14,
                weight: 1,
                fillOpacity: 1};

            case 15:
              var couleur_15 = getQuantileColor(dico_ratio["15"], dico_ratio)
              return {
                color: "#000000",
                fillColor: couleur_15,
                weight: 1,
                fillOpacity: 1};

            case 16:
              var couleur_16 = getQuantileColor(dico_ratio["16"], dico_ratio)
              return {
                color: "#000000",
                fillColor: couleur_16,
                weight: 1,
                fillOpacity: 1
              };


            case 17:
              var couleur_17 = getQuantileColor(dico_ratio["17"], dico_ratio)
              return {
                color: "#000000",
                fillColor: couleur_17,
                weight: 1,
                fillOpacity: 1
              };


            case 19:
              var couleur_19 = getQuantileColor(dico_ratio["19"], dico_ratio)
              return {
                color: "#000000",
                fillColor: couleur_19,
                weight: 1,
                fillOpacity: 1
              };

            case 20:
              var couleur_20 = getQuantileColor(dico_ratio["20"], dico_ratio)
              return {
                color: "#000000",
                fillColor: couleur_20,
                weight: 1,
                fillOpacity: 1
              };

            default:
              return {
                color: '#000000',
                fillColor: '#000000',
                weight: 1
              };
          }
        }
    }).addTo(map);}



    // Partie Event Listener des menus de choix de la statistique :


    // Le site démarre sur l'affichage de la densité surfacique de tous types de commerce, et on peut dès lors changer le type de commerce
    affichage_choro(densite_surf_arrdt)

    document.getElementById('type_comm').addEventListener('change', function () {
      var comm = this.value;
    
      if (comm == 'tout_comm') {
        affichage_choro(densite_surf_arrdt);
      } else if (comm == 'boulangerie') {
        affichage_choro(densite_surf_boulangerie_arrdt);
      } else if (comm == 'restaurant') {
        affichage_choro(densite_surf_restaurant_arrdt);
      } else if (comm == 'librairie') {
        affichage_choro(densite_surf_librairie_arrdt);
      }
    
    });

    // S'effectue à l'appelle d'un changement de statistique choisi
    document.getElementById('type_stat').addEventListener('change', function () {
      var stat = this.value;
    
      if (stat == 'dens_surf') {

        document.getElementById('type_comm').addEventListener('change', function () {
          var comm = this.value;
        
          if (comm == 'tout_comm') {
            affichage_choro(densite_surf_arrdt);
          } else if (comm == 'boulangerie') {
            affichage_choro(densite_surf_boulangerie_arrdt);
          } else if (comm == 'restaurant') {
            affichage_choro(densite_surf_restaurant_arrdt);
          } else if (comm == 'librairie') {
            affichage_choro(densite_surf_librairie_arrdt);
          }
        
        });

      } else if (stat == 'dens_tot') {
        
        document.getElementById('type_comm').addEventListener('change', function () {
          var comm = this.value;
        
          if (comm == 'tout_comm') {
            affichage_choro(densite_comm_arrdt);
            console.log("densite_comm_arrdt")
          } else if (comm == 'boulangerie') {
            affichage_choro(densite_comm_boulangerie_arrdt);
            console.log("densite_comm_boulangerie_arrdt")
          } else if (comm == 'restaurant') {
            affichage_choro(densite_comm_restaurant_arrdt);
            console.log("densite_comm_restaurant_arrdt")
          } else if (comm == 'librairie') {
            affichage_choro(densite_comm_librairie_arrdt);
          }
        
        });
      }
    
    });
    
    

});


document.getElementById('layer-select').addEventListener('change', function () {
    var layer = this.value;
  
    if (layer === 'arrondissements') {
      map.removeLayer(geojsonLayerQuartier);
      map.addLayer(geojsonLayerArrdt);
    } else if (layer === 'quartiers') {
      map.removeLayer(geojsonLayerArrdt);
      map.addLayer(geojsonLayerQuartier);
    }
  });