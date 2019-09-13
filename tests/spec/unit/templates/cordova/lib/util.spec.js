/*
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

const util = require('../../../../../../bin/templates/cordova/lib/util');

describe('Testing util.js:', () => {
    describe('deepMerge method', () => {
        it('should deep merge objects and arrays.', () => {
            const mergeTo = { foo: 'bar', abc: [1, 2, 3] };
            const mergeWith = { food: 'candy', abc: [5] };

            const actual = util.deepMerge(mergeTo, mergeWith);
            const expected = {
                foo: 'bar',
                food: 'candy',
                abc: [1, 2, 3, 5]
            };

            expect(actual).toEqual(expected);
        });
    });
});
