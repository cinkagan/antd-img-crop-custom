import React, { useState, useCallback, useMemo, useRef, forwardRef } from 'react';
import t from 'prop-types';
import LocaleReceiver from 'antd/es/locale-provider/LocaleReceiver';
import Modal from 'antd/es/modal';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './index.less';

const pkg = 'antd-img-crop';
const noop = () => { };

const MEDIA_CLASS = `ReactCrop__image`;

const EasyCrop = forwardRef((props, ref) => {
  const {
    src,
    onComplete
  } = props;

  const [crop, setCrop] = useState({
    unit: '%',
    width: 30
  });

  const onCropComplete = useCallback(
    (croppedArea) => {
      onComplete(croppedArea);
    },
    [onComplete]
  );

  return (
    <ReactCrop
      ref={ref}
      ruleOfThirds
      src={src}
      crop={crop}
      onChange={(_crop, percentCrop) => setCrop(_crop)}
      onComplete={onCropComplete}
    />
  );
});

EasyCrop.propTypes = {
  src: t.string,
  onComplete: t.func,
};

const ImgCrop = forwardRef((props, ref) => {
  const {
    shape,
    grid,
    quality,

    modalTitle,
    modalWidth,
    modalOk,
    modalCancel,

    beforeCrop,
    children,

    cropperProps,
  } = props;

  const [src, setSrc] = useState('');
  const [cropArea, setCropArea] = useState(null);

  const beforeUploadRef = useRef();
  const fileRef = useRef();
  const resolveRef = useRef(noop);
  const rejectRef = useRef(noop);

  const cropPixelsRef = useRef();

  /**
   * Upload
   */
  const renderUpload = useCallback(() => {
    const upload = Array.isArray(children) ? children[0] : children;
    const { beforeUpload, accept, ...restUploadProps } = upload.props;
    beforeUploadRef.current = beforeUpload;

    return {
      ...upload,
      props: {
        ...restUploadProps,
        accept: accept || 'image/*',
        beforeUpload: (file, fileList) =>
          new Promise((resolve, reject) => {
            if (beforeCrop && !beforeCrop(file, fileList)) {
              reject();
              return;
            }

            fileRef.current = file;
            resolveRef.current = resolve;
            rejectRef.current = reject;

            const reader = new FileReader();
            reader.addEventListener('load', () => {
              setSrc(reader.result);
            });
            reader.readAsDataURL(file);
          }),
      },
    };
  }, [beforeCrop, children]);

  /**
   * EasyCrop
   */
  const onComplete = useCallback((croppedArea) => {
    cropPixelsRef.current = croppedArea;
    setCropArea(croppedArea);
  }, []);

  /**
   * Modal
   */
  const modalProps = useMemo(() => {
    const obj = { width: modalWidth, okText: modalOk, cancelText: modalCancel };
    Object.keys(obj).forEach((key) => {
      if (!obj[key]) delete obj[key];
    });
    return obj;
  }, [modalCancel, modalOk, modalWidth]);

  const onClose = useCallback(() => {
    setSrc('');
  }, []);

  const onOk = useCallback(async () => {
    onClose();
    const image = document.querySelector(`.${MEDIA_CLASS}`);
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0,
      0,
      cropArea.width,
      cropArea.height
    );

    const { type, name, uid } = fileRef.current;
    canvas.toBlob(
      async (blob) => {
        let newFile = new File([blob], name, { type });
        newFile.uid = uid;

        if (typeof beforeUploadRef.current !== 'function') return resolveRef.current(newFile);

        const res = beforeUploadRef.current(newFile, [newFile]);

        if (typeof res !== 'boolean' && !res) {
          console.error('beforeUpload must return a boolean or Promise');
          return;
        }

        if (res === true) return resolveRef.current(newFile);
        if (res === false) return rejectRef.current('not upload');
        if (res && typeof res.then === 'function') {
          try {
            const passedFile = await res;
            const type = Object.prototype.toString.call(passedFile);
            if (type === '[object File]' || type === '[object Blob]') newFile = passedFile;
            resolveRef.current(newFile);
          } catch (err) {
            rejectRef.current(err);
          }
        }
      },
      type,
      quality
    );
  }, [cropArea, onClose, quality]);

  const renderComponent = (titleOfModal) => (
    <>
      {renderUpload()}
      {src && (
        <Modal
          visible={true}
          wrapClassName={`${pkg}-modal`}
          title={titleOfModal}
          onOk={onOk}
          onCancel={onClose}
          maskClosable={false}
          destroyOnClose
          {...modalProps}
        >
          <EasyCrop
            ref={ref}
            src={src}
            shape={shape}
            grid={grid}
            onComplete={onComplete}
            cropperProps={cropperProps}
          />
        </Modal>
      )}
    </>
  );

  if (modalTitle) return renderComponent(modalTitle);

  return (
    <LocaleReceiver>
      {(locale, localeCode) => renderComponent(localeCode === 'zh-cn' ? '编辑图片' : 'Edit image')}
    </LocaleReceiver>
  );
});

ImgCrop.propTypes = {
  quality: t.number,
  modalTitle: t.string,
  modalWidth: t.oneOfType([t.number, t.string]),
  modalOk: t.string,
  modalCancel: t.string,
  beforeCrop: t.func,
  children: t.node,
};

ImgCrop.defaultProps = {
  quality: 0.4,
};

export default ImgCrop;
