module.exports.channel = (guild, input) => {
  let id = input.replaceAll(/[^0-9]/, '');
  return guild.channels.get(id);

  guild.channels.forEach(channel => {
    if(`#${channel.name}`.toLowerCase() === input.toLowerCase()) return channel;
  });

  guild.channels.forEach(channel => {
    if(channel.name.toLowerCase() === input.toLowerCase()) return channel
  });

  let matching = [];
  guild.channels.forEach(channel => {
    if(`#${channel.name.toLowerCase()}`.includes(input.toLowerCase())) matching.push(channel);
  });
  if(matching.length === 1) return matching[0];
  if (matching.length > 1) return 'TOO_MANY_RESULTS';

  matching = [];
  guild.channels.forEach(channel => {
    if(input.toLowerCase().includes(channel.name.toLowerCase())) matching.push(channel);
  });
  if(matching.length === 1) return matching[0];
  if (matching.length > 1) return 'TOO_MANY_RESULTS';

  return 'NO_RESULTS';
}

// TODO: Continue here
module.exports.user = (input) => {
  let id = input.replaceAll(/[^0-9]/, '');
  return guild.channels.get(id);

  guild.channels.forEach(channel => {
    if(`#${channel.name}`.toLowerCase() === input.toLowerCase()) return channel;
  });

  guild.channels.forEach(channel => {
    if(channel.name.toLowerCase() === input.toLowerCase()) return channel
  });

  let matching = [];
  guild.channels.forEach(channel => {
    if(`#${channel.name.toLowerCase()}`.includes(input.toLowerCase())) matching.push(channel);
  });
  if(matching.length === 1) return matching[0];
  if (matching.length > 1) return 'TOO_MANY_RESULTS';

  matching = [];
  guild.channels.forEach(channel => {
    if(input.toLowerCase().includes(channel.name.toLowerCase())) matching.push(channel);
  });
  if(matching.length === 1) return matching[0];
  if (matching.length > 1) return 'TOO_MANY_RESULTS';

  return 'NO_RESULTS';
}
