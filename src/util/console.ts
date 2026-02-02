export const logGreen = (message: string) => {
  console.log(`\x1b[102m DONE \x1b[0m ${message}`);
};

export const logBlue = (message: string) => {
  console.log(`\x1b[106m INFO \x1b[0m ${message}`);
};

export const logRed = (message: string) => {
  console.log(`\x1b[101m ERROR \x1b[0m ${message}`);
};
