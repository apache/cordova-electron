/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */
document.addEventListener("deviceready", () => {
    const tests = {
        testProcess: null,
        testLocation: null,
        testMany: null,
        testError: null,
        testException: null,
        testEchoElectron: ['echo', 'echoo', 'echooo'],
        testEchoBrowser: ['echo', 'echoo', 'echooo'],
        testUnknownAction: ['echo', 'echoo', 'echooo']
    }
    for(let test in tests) {
        cordova.exec(
            data => {
                console.log(`${test} success callback`, data)
            },
            error => {
                console.error(`${test} error callback`, error)
            },
            'Sample',
            test,
            tests[test]
        );
    }

    cordova.exec(
        data => {
            console.log(`UnkonwService success callback`, data)
        },
        error => {
            console.error(`UnkonwService error callback`, error)
        },
        'UnknownService',
        'irrelevant'
    );
});
