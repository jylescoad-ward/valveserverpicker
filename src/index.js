const $ = require("jquery");
const NetworkData = require("./../regions.json");
const toolbox = require("tinytoolbox");

var asyncForEach = async (array, callback) => {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array)
	}
}

var generateServers = async () =>
{
	await asyncForEach(NetworkData,(d)=>{
		if ($(`div.serverList ul[country=${d.geo.country}]`).length < 1)
		{
			$(`div.serverList`).append(`
			<ul country=${d.geo.country}>

			</ul>
			`)
		}
		$(`div.serverList ul[country=${d.geo.country}]`).append(`
		<li>
			<label>
				<input type="checkbox" action="region" region="${d.region}"/>
				<span title="${d.region}">${d.geo.country}/${d.geo.region} (${d.region})</span>
			</label>
		</li>
		`)
	})
	return;
}


$(document).ready(async ()=>{
	console.log('Page Ready')
	localStorage.valve_selectedServers = JSON.stringify([]);

	await generateServers();

	$("input[type=checkbox][action=region]").click((me)=>{
		var selectedServers = JSON.parse(localStorage.valve_selectedServers)
		if (me.target.checked)
		{
			selectedServers.push(me.target.attributes.region.value);
			console.log(`Added '${me.target.attributes.region.value}' from selectedServers`)
		} else {
			selectedServers = selectedServers.filter(function (str) { return str.indexOf(me.target.attributes.region.value) === -1; });
			console.log(`Removed '${me.target.attributes.region.value}' from selectedServers`)
		}
		localStorage.valve_selectedServers = JSON.stringify(selectedServers);
	})

	$("a.btn#export").click(async ()=>{
		var selectedServers = JSON.parse(localStorage.valve_selectedServers);
		if (selectedServers.length < 1)
		{
			alert("No servers are selected");
			return;
		}

		var addresses = [];
		var servers = [];
		await asyncForEach(NetworkData,(s)=>{
			if (toolbox.arrayContains(selectedServers,s.region))
			{
				servers.push(s);
			}
		})
		await asyncForEach(servers,async (s)=>{
			addresses.push(s.region);
			/*await asyncForEach(s.relays,(relay)=>{
				var floor = relay.port_range[0];
				var ceiling = relay.port_range[1];
				while(floor <= ceiling)
				{
					addresses.push(`${relay.ipv4}:${floor}`);
					floor++;
				}
			})*/
		})
		console.log(`Generated Command "mm_dedicated_force_servers ${addresses.join(',')}"`)
		$("span.command").html(`mm_dedicated_force_servers ${addresses.join(',')}`)
	})
})

