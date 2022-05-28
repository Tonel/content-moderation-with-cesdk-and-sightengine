import classNames from 'classnames';
import React, { useMemo } from 'react';
import StyledPopover from '../StyledPopover/StyledPopover';
import BlockLabel  from './BlockLabel';
import { ReactComponent as CheckIcon } from './icons/check.svg';
import { ReactComponent as ClockIcon } from './icons/clock.svg';
import { ReactComponent as InfoIcon } from './icons/info.svg';
import styles from './ValidationBox.module.css';
import ValidationPopover from './ValidationPopover';

const ValidationBox = ({
  results,
  onSelect,
}) => {
  // if the moderation result API has been called
  const checkStatus = results && results.length > 0 ? 'performed' : 'pending';

  const StatusIcon = checkStatus === 'pending' ? ClockIcon : CheckIcon;

  const unsuccessfulResults = useMemo(
    () => results.filter((result) => result.state !== 'success'),
    [results]
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.headerTitle + ' space-x-2'}>
          <span>Check {checkStatus}</span>
          <StatusIcon />
        </span>
        <span className={styles.headerInfo}>
          {unsuccessfulResults.length} results
        </span>
      </div>
      <div className={styles.body}>
        <div className={`${styles.resultRow} ${styles.resultHeader}`}>
            <span className={styles.checkNameWrapper + ' space-x-2'}>
              Category
            </span>
          <span
            className={styles.blockName}
          >
            Block Name
          </span>
          <span>
            Action
          </span>

        </div>
        {unsuccessfulResults.map((result, i) => (
          <div className={styles.resultRow} key={i}>
            <span className={styles.checkNameWrapper + ' space-x-2'}>
              <span
                className={classNames(
                  styles.checkStatus,
                  styles['checkStatus--' + result.state]
                )}
              ></span>
              <span className={styles.checkName}>{result.name}</span>

              <StyledPopover
                content={
                  <ValidationPopover
                    validationTitle={result.name}
                    validationDescription={result.description}
                  />
                }
              >
                <InfoIcon style={{ cursor: 'pointer' }} />
              </StyledPopover>
            </span>
            <BlockLabel
              blockType={result.blockType}
              blockName={result.blockName}
            />
            <button className={styles.checkCTA} onClick={() => {onSelect(result.blockId)}}>
              Select
            </button>
          </div>
        ))}
        {checkStatus === 'pending' && results.length === 0 &&
          <div className="flex w-full flex-grow items-center justify-center text-center">
            No check has been performed yet.
          </div>
        }
        {checkStatus === 'performed' &&
          unsuccessfulResults.length === 0 &&
          <div className="flex w-full flex-grow items-center justify-center text-center">
            No content violations found. <br />
            Add possibly offensive content and run it again.
          </div>
        }
      </div>
    </div>
  );
};

export default ValidationBox;
