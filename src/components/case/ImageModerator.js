import CreativeEditorSDK from '@cesdk/cesdk-js';
import ValidationBox from '../ui/ValidationBox/ValidationBox';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import { ReactComponent as RefreshIcon } from './refresh.svg';
import { moderateImages } from './moderationUtils';
import styles from './ImageModerator.module.css';
import classNames from "classnames";

function selectBlock(cesdk, blockId) {
  // deselecting all blocks
  cesdk.engine.block
    .findAllSelected()
    .forEach((block) => cesdk.engine.block.setSelected(block, false));

  // selecting the block having the blockId passed as parameter
  cesdk.engine.block.setSelected(blockId, true);
}

const ImageModerator = () => {
  const cesdkContainerDiv = useRef(null);
  const cesdkRef = useRef(null);

  const [validationResults, setValidationResults] = useState([]);

  useEffect(() => {
    // initializing CE.SDK if it has not been initialized yet
    if (cesdkContainerDiv.current && !cesdkRef.current) {
      const config = {
        role: 'Adopter',
        theme: 'light',
        initialSceneURL: `${window.location.protocol + "//" + window.location.host}/cases/content-moderation/example.scene`,
        ui: {
          elements: {
            panels: {
              settings: true
            },
            navigation: {
              action: {
                save: true
              }
            }
          }
        },
        callbacks: {
          // calling this function when the
          // user presses the "Save" button
          onSave: () => runImageModerationCheck()
        }
      };

      CreativeEditorSDK.init(cesdkContainerDiv.current, config).then(
        (instance) => {
          cesdkRef.current = instance;

          // running the moderation check on initialization
          runImageModerationCheck();
        }
      );
    }

    return () => {
      if (cesdkRef.current) {
        cesdkRef.current.dispose();
      }
    };

  }, [cesdkContainerDiv]);

  const runImageModerationCheck = useCallback(async () => {
    if (!cesdkRef.current) {
      return;
    }

    // retrieving the moderation results
    const validationResults = await moderateImages(cesdkRef.current);

    setValidationResults(validationResults);
  }, []);

  return (
    <div className={classNames(styles.wrapper, "space-y-2")}>
      <div className={styles.header}>
        <div
          className={styles.headerDiv}
        >
          <div>
            <h3 className="h4" style={{ color: 'white' }}>
              Content Moderation
            </h3>
            <p
              className={styles.headerDivMessage}
            >
              Check images for compliance with your content guidelines before
              further processing and provide user feedback.
            </p>
          </div>
          <button
            onClick={() => runImageModerationCheck()}
            className={'button button--white space-x-2'}
          >
            <span>Validate Image Content</span>
            <RefreshIcon />
          </button>
        </div>
        <ValidationBox
          results={validationResults}
          onSelect={(blockId) => { selectBlock(cesdkRef.current, blockId)}}
        />
      </div>
      <div className={styles.cesdkWrapper}>
        <div ref={cesdkContainerDiv} className={styles.cesdk}></div>
      </div>
    </div>
  );
};

export default ImageModerator;
