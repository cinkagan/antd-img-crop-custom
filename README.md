# antd-img-crop-custom
An image cropper for Ant Design [Upload](https://ant.design/components/upload/).

You can scale as you wish without **aspect**

If you want to crop at a certain rate, you should use [this](https://github.com/nanxiaobei/antd-img-crop) 

## Install

```sh
npm i --save antd-img-crop-custom
```

## Usage

```jsx harmony
import ImgCrop from 'antd-img-crop-custom';
import { Upload } from 'antd';

const Demo = () => (
  <ImgCrop>
    <Upload>+ Add image</Upload>
  </ImgCrop>
);