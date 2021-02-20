const fs = require("fs");
const toolbox = require("tinytoolbox");

var asyncForEach = async (array, callback) => {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array)
	}
}

var getRegionName = async(address) =>
{
	return require("axios").get(`https://ipinfo.io/${address}/geo?token=50335344ff8e4d`)
}
console.log("Getting Remote Region Data")
var start_timestamp = Date.now();
require("axios").get("https://raw.githubusercontent.com/SteamDatabase/SteamTracking/master/Random/NetworkDatagramConfig.json").then(async (r)=>{
	var newJSON = [];
	var queue = new toolbox.queue({log:true});
	await asyncForEach(toolbox.JSON.toArray(r.data.pops),(d)=>{
		if (d[1].relay_addresses == undefined) return;
		queue.add(async ()=>{
			var regionData = await getRegionName(d[1].relay_addresses[0].split(':')[0].split('-')[0]);
			regionData = regionData.data;
			if (regionData.bogon) return;
			d[1].geo = 
			{
				city: regionData.city,
				region: regionData.region,
				country: regionData.country,
				timezone: regionData.timezone,
			}
			d[1].region = d[0];
			newJSON.push(d[1]);
			return;
		})
	})
	queue.start(()=>{
		if (fs.existsSync('regions.json'))
		{
			fs.unlinkSync('regions.json');
		}
		fs.writeFile('regions.json',JSON.stringify(newJSON,null,'\t'),(e)=>{
			if (e) throw e;
			console.log('Created new Region File');
			console.log(`Took ${(Date.now() - start_timestamp)/1000}s`)
		})
	});
})

