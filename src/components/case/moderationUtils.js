export const moderateImages = async (cesdk) => {
  // retrieving all image blocks with a name
  const imageBlocksData = cesdk.engine.block
    .findByType('image')
    .map((blockId) => ({
      blockId,
      url: cesdk.engine.block.getString(blockId, 'image/imageFileURI'),
      blockType: cesdk.engine.block.getType(blockId),
      blockName: cesdk.engine.block.getName(blockId)
    })).filter(
      (block) => {
        return block.blockName !== ""
      }
    );

  console.log("Moderation check launched...");

  // turning the moderation results on each image block into
  // a flat array
  const imagesWithValidity = await Promise.all(
    imageBlocksData.flatMap(async (imageBlockData) => {
      // retrieving the moderation results
      const imageModerationResults = await callSightEngineModerationAPI(
        imageBlockData.url
      );

      console.log(imageBlockData.blockName, imageModerationResults)

      return imageModerationResults.flatMap((checkResult) => ({
        ...checkResult,
        ...imageBlockData
      }));
    })
  );

  console.log("Moderation check completed");

  return imagesWithValidity.flat();
};

// a cache variable to avoid
// calling the SightEngine API when not necessary
const complianceCache = {}
const callSightEngineModerationAPI = async (url) => {
  // if the url is already present in the cache, then
  // return the result previously retrieved
  if (complianceCache[url]) {
    return complianceCache[url];
  }

  // calling the SightEngine moderation API
  const response = await fetch(
    'https://europe-west3-img-ly.cloudfunctions.net/sightengineApiProxy?url=' +
      encodeURIComponent(url),
    {
      method: 'get',
      headers: {
        accept: 'application/json',
        'Accept-Language': 'en-US,en;q=0.8',
        'Content-Type': 'multipart/form-data;'
      }
    }
  );
  const results = await response.json();
  if (results.error) {
    console.error(results.error)

    return []
  } else {
    const checkResults = [
      {
        name: 'Weapons',
        description: 'Handguns, rifles, machine guns, threatening knives...',
        state: percentageToState(results.weapon)
      },
      {
        name: 'Alcohol',
        description: 'Wine, beer, cocktails, champagne...',
        state: percentageToState(results.alcohol)
      },
      {
        name: 'Drugs',
        description: 'Cannabis, syringes, glass pipes, bongs, pills...',
        state: percentageToState(results.drugs)
      },
      {
        name: 'Nudity',
        description: 'Images that contain either raw nudity or partial nudity.',
        state: percentageToState(1 - results.nudity.safe)
      }
    ];

    // storing the SightEngine results in the cache
    complianceCache[url] = checkResults;

    return checkResults;
  }
};

const percentageToState = (percentage) => {
  // defining the custom moderation logic based on the
  // percentage returned by SightEngine
  if (percentage > 0.8) {
    return 'failed';
  } else if (percentage > 0.4) {
    return 'warning';
  } else {
    return 'success';
  }
};
