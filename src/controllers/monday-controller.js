const mondayService = require('../services/monday-service');
const transformationService = require('../services/transformation-service');
const { TRANSFORMATION_TYPES } = require('../constants/transformation');

async function executeAction(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  try {
    const { inputFields } = payload;
    const { boardId, itemId, sourceColumnId, targetColumnId, transformationType } = inputFields;

    const text = await mondayService.getColumnValue(shortLivedToken, itemId, sourceColumnId);
    if (!text) {
      return res.status(200).send({});
    }
    const transformedText = transformationService.transformText(
      text,
      transformationType ? transformationType.value : 'TO_UPPER_CASE'
    );

    await mondayService.changeColumnValue(shortLivedToken, boardId, itemId, targetColumnId, transformedText);

    return res.status(200).send({});
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'internal server error' });
  }
}

async function getRemoteListOptions(req, res) {
  try {
    return res.status(200).send(TRANSFORMATION_TYPES);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'internal server error' });
  }
}

async function setJobNumber(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;
  try {
    const { inputFields } = payload;
    const { boardId, itemId, columnId, jobId } = inputFields;

    const jobType = await mondayService.getColumnText(shortLivedToken, itemId, columnId);

    const joblist = await mondayService.queryboard(shortLivedToken, boardId, jobId);
    // var output = joblist.filter(x => x.column_values.text == 'OTO212'  );

    var output = joblist.filter(function(x){
      return x.column_values[0].text.startsWith(jobType);
    });
    
    var numberlist = output.map(function(el) {
      return el.column_values[0].text.replace(new RegExp("^" + jobType), '');
    });
    const newnum = Math.max(...numberlist)+1;
    const newJob = '"' + jobType + newnum + '"';

    await mondayService.changeColumnValue(shortLivedToken, boardId, itemId, jobId, newJob);

    return res.status(200).send({});
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'internal server error' });
  }
}

module.exports = {
  executeAction,
  getRemoteListOptions,
  setJobNumber,
};
