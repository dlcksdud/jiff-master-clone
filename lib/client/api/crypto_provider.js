module.exports = function (jiffClient) {
  /**
   * Requests secret(s) from the server (crypto provider) of type matching the given label.
   * @method from_crypto_provider
   * @memberof module:jiff-client~JIFFClient
   * @instance
   * @param {string} label - the type of secret(s) being requested from crypto_provider (e.g. triplet, quotient, numbers, etc)
   * @param {Array} [receivers_list=all_parties] - array of party ids that want to receive the secret(s), by default, this includes all parties.
   * @param {number} [threshold=receivers_list.length] - the min number of parties needed to reconstruct the secret(s).
   * @param {number} [Zp=jiff_instance.Zp] - the mod, defaults to the Zp of the instance.
   * @param {string} [op_id=auto_Gen()] - an id which is used to identify the secret requested, so that every party
   *                              gets a share from the same secret for every matching instruction. An automatic id
   *                              is generated by increasing a local counter per label, default ids suffice when all
   *                              parties execute all instructions in the same order.
   * @param {object} [params={}] - any additional parameters specific to the label, these are defined by the label handler at the server side.
   *                               some of these parameters may be optional, while others may be required.
   * @returns {promise} a promise to the secret(s) provided by the server/crypto provider, the promise returns an object with the given format:
   *                               { values: <any values returned by the server side>, shares: <array of secret share objects matching shares returned by server by index>}
   */
  jiffClient.from_crypto_provider = function (label, receivers_list, threshold, Zp, op_id, params) {
    // defaults
    if (Zp == null) {
      Zp = jiffClient.Zp;
    }
    if (receivers_list == null) {
      receivers_list = [];
      for (var i = 1; i <= jiffClient.party_count; i++) {
        receivers_list.push(i);
      }
    } else {
      jiffClient.helpers.sort_ids(receivers_list);
    }
    if (threshold == null) {
      threshold = receivers_list.length;
    }
    if (op_id == null) {
      op_id = jiffClient.counters.gen_op_id('crypto_provider:' + label, receivers_list);
    }
    if (params == null) {
      params = {};
    }

    // Send a request to the server
    var msg = {label: label, op_id: op_id, receivers: receivers_list, threshold: threshold, Zp: Zp, params: params};
    msg = jiffClient.hooks.execute_array_hooks('beforeOperation', [jiffClient, 'crypto_provider', msg], 2);
    msg = JSON.stringify(msg);

    // Setup deferred to handle receiving the result later.
    jiffClient.deferreds[op_id] = new jiffClient.helpers.Deferred();
    var result = jiffClient.deferreds[op_id].promise;

    // send a request to the server.
    jiffClient.socket.safe_emit('crypto_provider', msg);
    return result;
  };
};