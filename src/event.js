const obj = {
  paths: [],
  data: undefined,
};

const event = (paths, data) => {
  obj.paths = paths;
  obj.data = data;
  return obj;
};

event.reset = () => {
  obj.paths = [];
  obj.data = undefined;
};

export default event;