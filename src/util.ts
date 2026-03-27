/** 判断是数字 */
export const isNumber = (value: any): boolean => {
  return !isNaN(Number.parseFloat(value)) && isFinite(value);
};

/** 转成数字 */
export const toNumber = (str: any): number => {
  return isNumber(str) ? Number(str) : 0;
};

export const toArray = (data: any) => (Array.isArray(data) ? data : []);

/** 判断数据是不是对象类型 */
export const isObject = (data: any): boolean => {
  return data && `${Object.prototype.toString.call(data)}`.includes('Object');
};

export const toObject = (data: any): object => {
  return isObject(data) ? data : {};
};
