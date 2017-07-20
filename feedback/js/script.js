"use strict";

var recaptcha1;
// var recaptcha2;
var onloadCallback = function() {
    // отрисовка recaptcha1 на элементе с id="recaptcha1"
    recaptcha1 = grecaptcha.render('recaptcha1', {
        'sitekey' : 'ВАШ ПУБЛИЧНЫЙ КЛЮЧ'
    });
    /* отрисовка recaptcha2 на элементе с id="recaptcha2"
    recaptcha2 = grecaptcha.render('recaptcha2', {
        'sitekey' : 'ВАШ ПУБЛИЧНЫЙ КЛЮЧ'
    });*/
};

//после загрузки веб-страницы
$(function () {

    var ProcessForm = function (parameters) {

        // id формы обратной связи
        this.idForm = parameters['idForm'] || 'feedbackForm';
        // id Google reCaptcha v2
        this.idCaptcha = parameters['idCaptcha'] || recaptcha1;
        // скрыть форму после отправки
        this.hideForm = parameters['hideForm'] || true;
        // наличие у формы блока загрузки файлов
        this.existenceUploadsFile = parameters['existenceUploadsFile'] || true;
        // наличие у формы капчи
        this.existenceCaptcha = parameters['existenceCaptcha'] || true;
        // количество элементов input для загрузки файлов
        this.countFiles = parameters['countFiles'] || 5;
        // максимальный размер файла для загрузки (по умолчанию 512 Кбайт)
        this.maxSizeFile = parameters['maxSizeFile'] || 524288;
        // допустимые разрешения файлов
        this.validFileExtensions = parameters['validFileExtensions'] || ['jpg', 'jpeg', 'bmp', 'gif', 'png'];
        // флажок о принятии пользовательского соглашения перед отправкой формы
        this.agreeCheckbox = parameters['agreeCheckbox'] || true;

        // инициализация
        this.init = function () {
            // получаем форму
            var submitForm = document.getElementById(this.idForm);
            // отправка формы
            $(submitForm).submit($.proxy(this.submitForm, this));

            if (this.existenceUploadsFile) { // добавление новых элементов input с type="file" и изменение существующих
                $('#' + this.idForm + ' .countFiles').text(this.countFiles);
                // добавление нового элемента input с type="file"
                $(document).on('change', '#' + this.idForm + ' input[name="attachment[]"]', $.proxy(this.changeInputFile, this));
            }

            if (this.agreeCheckbox) { // добавление новых элементов input с type="file"
                // добавление нового элемента input с type="file"
                $(document).on('change', '#' + this.idForm + ' input[name="agree"]', $.proxy(this.changeAgreement, this));
            }

            if (this.hideForm) {
                $(submitForm).parent().find('.success-message').click(function (e) {
                    e.preventDefault();
                    $(this).addClass('hidden');
                    $(submitForm).show();
                });
            }
        };
    };

    // переключить во включенное или выключенное состояние кнопку submit
    ProcessForm.prototype.changeStateSubmit = function (state) {
        var submitForm = document.getElementById(this.idForm);
        $(submitForm).find('[type="submit"]').prop('disabled', state);
    };

    // изменение состояния кнопки submit в зависимости от состояния checkbox agree
    ProcessForm.prototype.changeAgreement = function (e) {
        if (e.currentTarget.checked) {
            this.changeStateSubmit(false);
        } else {
            this.changeStateSubmit(true);
        }
    };

    // метод, возвращающий результат проверки расширения файла допустимому
    ProcessForm.prototype.validateFileExtension = function (filename) {
        // получаем расширение файла
        var fileExtension = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
        // если есть расширение, то проверяем соотвествует ли оно допустимому
        if (fileExtension) {
            for (var i = 0; i <= this.validFileExtensions.length; i++) {
                if (this.validFileExtensions[i] === fileExtension) {
                    return true;
                }
            }
        }
        return false;
    };

    // валилация формы
    ProcessForm.prototype.validateForm = function () {
        var _this = this;
        var validForm = true;
        var submitForm = document.getElementById(this.idForm);
        $(submitForm).find('input,textarea').each(function () {
            if (this.checkValidity()) {
                _this.changeStateInput(this, 'success');
            } else {
                _this.changeStateInput(this, 'error');
                $.jGrowl('Поле: "<strong>' + $(this).parent().find('label').text() + '</strong>"<br>' + this.validationMessage, {
                    theme: 'jgrowl-error',
                    life: 10000
                });
                validForm = false;
            }
        });

        if (this.existenceCaptcha) {
            // получаем ответ капчи
            var captcha = grecaptcha.getResponse(this.idCaptcha);
            // есди длина капчи нулевая
            if (!captcha.length) {
                // Выводим сообщение об ошибке
                $.jGrowl('Вы не прошли проверку "Я не робот"', {
                    theme: 'jgrowl-error',
                    life: 10000
                });
                validForm = false;
            }
        }
        /*    $('с').text('* Вы не прошли проверку "Я не робот"');
        } else {
            // получаем элемент, содержащий капчу
            $('#recaptchaError').text('');
        }*/
        return validForm;
    };

    // изменение состояния элемента формы (success, error, clear)
    ProcessForm.prototype.changeStateInput = function (input, state) {
        input = $(input);
        var inputGroup = input.parents('.form-group');
        var glyphiconInput = inputGroup.find('.form-control-feedback');
        if (state === 'error') {
            inputGroup.removeClass('has-success').addClass('has-error');
            console.log(input.prop('tagName'));
            console.log(input.prop('tagName').toLowerCase());
            if (input.prop("tagName").toLowerCase() !== 'textarea') {
                glyphiconInput.removeClass('glyphicon-ok').addClass('glyphicon-remove');
            }
        } else if (state === 'success') {
            inputGroup.removeClass('has-error').addClass('has-success');
            if (input.prop("tagName").toLowerCase() !== 'textarea') {
                glyphiconInput.removeClass('glyphicon-remove').addClass('glyphicon-ok');
            }
        } else {
            inputGroup.removeClass('has-success has-error');
            glyphiconInput.removeClass('glyphicon-ok glyphicon-remove');
        }
    };

    // disabled и enabled изображений для FormData
    ProcessForm.prototype.changeStateImages = function (state) {
        if (!this.existenceUploadsFile) {
            return;
        }
        var submitForm = document.getElementById(this.idForm);
        var files = $(submitForm).find('[name="attachment[]"]');
        for (var i = 0; i < files.length; i++) {
            // получить список файлов элемента input с type="file"
            var fileList = files[i].files;
            // если элемент не содержит файлов, то перейти к следующему
            if (fileList.length > 0) {
                // получить первый файл из списка
                var file = fileList[0];
                // проверить тип файла и размер
                if (!((this.validateFileExtension(file.name)) && (file.size < this.maxSizeFile))) {
                    $(files[i]).prop('disabled', state);
                }
            } else {
                $(files[i]).prop('disabled', state);
            }
        }
    };

    // сбор данных для отправки на сервер с помощью FormData
    ProcessForm.prototype.collectData = function () {
        this.changeStateImages(true); // отключаем отправку файлов (disabled) не удовлетворяющие требованиям
        this.dataForm = new FormData(document.getElementById(this.idForm)); // собираем данные
        if (this.existenceCaptcha) {
            this.dataForm.append('g-recaptcha-response', grecaptcha.getResponse(this.idCaptcha)); // отправляем ответ reCAPTCHA
        }
        this.changeStateImages(false); // после сбора данных переводим состояние элементов в enabled
    };

    // отправка формы
    ProcessForm.prototype.submitForm = function (e) {
        var _this = this;
        e.preventDefault();
        if (this.validateForm() === false) {
            return;
        }
        this.collectData();
        $.ajax({
            type: "POST",
            url: $('#' + _this.idForm).attr('action'),
            data: _this.dataForm, // данные для отправки на сервер
            contentType: false,
            processData: false,
            cache: false,
            beforeSend: function () {
                $('#' + _this.idForm + ' .progress').show();
                _this.changeStateSubmit(true);
            },

            xhr: function () {
                var myXhr = $.ajaxSettings.xhr();
                if (myXhr.upload) {
                    myXhr.upload.addEventListener('progress', function (event) {
                        // если известно количество байт для пересылки
                        if (event.lengthComputable) {
                            // получаем общее количество байт для пересылки
                            var total = event.total;
                            // получаем какое количество байт уже отправлено
                            var loaded = event.loaded;
                            // определяем процент отправленных данных на сервер
                            var progress = ((loaded * 100) / total).toFixed(1);
                            // обновляем состояние прогресс бара Bootstrap
                            var progressBar = $('#' + _this.idForm + ' .progress-bar');
                            progressBar.attr('aria-valuenow', progress);
                            progressBar.width(progress + '%');
                            progressBar.find('span').text(progress + '%');
                        }
                    }, false);
                }
                return myXhr;
            },


            success: function (data) {
                $('#' + _this.idForm + ' .progress').hide();

                data = JSON.parse(data);
                //устанавливаем элементу, содержащему текст ошибки, пустую строку
                $('#' + _this.idForm + '.error').text('');
                var submitForm = $('#' + _this.idForm);
                // если сервер вернул ответ success, то значит двнные отправлены
                if (data.result === "success") {
                    $.jGrowl('Форма успешно отправлена!', {theme: 'jgrowl-success', life: 10000});
                    document.getElementById(_this.idForm).reset();

                    submitForm.find('input,textarea').each(function () {
                        _this.changeStateInput(this, 'clear');
                    });
                    if (_this.existenceUploadsFile) {
                        $('#' + _this.idForm + ' .countFiles').parents('.form-group').html(
                            '<p style="font-weight: 700;">Прикрепить к сообщению файлы (максимум <span class="countFiles">' +
                            _this.countFiles + '</span>):</p><input type="file" name="attachment[]">' +
                            '<p style="margin-top: 3px; margin-bottom: 3px; color: #ff0000;"></p>');
                    }
                    if (_this.existenceCaptcha) {
                        _this.refreshCaptcha();
                    }
                    if (_this.hideForm) {
                        submitForm.hide();
                        submitForm.parent().find('.success-message').removeClass('hidden');
                    }
                } else {
                    _this.changeStateSubmit(false);
                    $('#' + _this.idForm + ' .progress-bar').css('width', '0%');

                    // если сервер вернул ответ error...
                    $.jGrowl('<strong>Ошибка!</strong><br>Форму не удалось отправить.', {
                        theme: 'jgrowl-warning',
                        life: 10000
                    });

                    // сбрасываем состояние всех input и textarea элементов
                    submitForm.find('input,textarea').each(function () {
                        _this.changeStateInput(this, 'clear');
                    });

                    // отображаем все ошибки
                    for (var error in data) {
                        if (data.hasOwnProperty(error)) {
                            if (error === 'result') { // кроме той, которая имеет ключ result
                                continue;
                            }
                            if (error !== 'info' && error !== 'log') { // кроме тех, которые имеют ключ info или log
                                $.jGrowl(data[error], {theme: 'jgrowl-error', life: 5000});
                                _this.changeStateInput($(submitForm).find('[name="' + error + '"]').eq(0), 'error');
                            }
                            if (error === 'info') { // выводим все сообщения с ключом info с помощью jGrowl
                                data[error].forEach(function (info, i, error) {
                                    $.jGrowl(info, {theme: 'jgrowl-error', life: 5000});
                                });
                            }
                            if (error === 'log') { // выводим все сообщения с ключом log в консоль браузера
                                data[error].forEach(function (log, i, error) {
                                    console.log(log);
                                });
                            }
                        }
                    }
                }
            },
            error: function (request) {
                $.jGrowl('Произошла ошибка ' + request.responseText + ' при отправке данных.', {
                    theme: 'jgrowl-error',
                    life: 5000
                });
            }
        });
    };

    // обновление капчи
    ProcessForm.prototype.refreshCaptcha = function () {
        grecaptcha.reset(this.idCaptcha);
    };

    // изменение элемента input с type="file"
    ProcessForm.prototype.changeInputFile = function (e) {
        // условия для добавления нового элемента input с type="file"
        console.log('1');
        var isSelectFile = e.currentTarget.files.length > 0;
        var isNextInput = $(e.currentTarget).next('p').next('input[name="attachment[]"]').length === 0;
        var isMaxInput = $('#' + this.idForm + ' input[name="attachment[]"]').length < this.countFiles;
        var inputFile =
            '<input type="file" name="attachment[]">' +
            '<p style="margin-top: 3px; margin-bottom: 3px; color: #ff0000;"></p>';
        if (isSelectFile && isNextInput && isMaxInput) {
            $(e.currentTarget).next('p').after(inputFile);
        }
        // если файл выбран, то выполняем следующие действия...
        if (e.currentTarget.files.length > 0) {
            // получим файл
            var file = e.currentTarget.files[0];
            // проверим размер и расширение файла
            if (file.size > this.maxSizeFile) {
                $(e.currentTarget).next('p').text('*Файл не будет отправлен, т.к. его размер больше ' + this.maxSizeFile / 1024 + 'Кбайт');
            } else if (!this.validateFileExtension(file.name)) {
                $(e.currentTarget).next('p').text('*Файл не будет отправлен, т.к. его тип не соответствует разрешённому');
            } else {
                if ($(e.currentTarget).next('p')) {
                    $(e.currentTarget).next('p').text('');
                }
            }
        } else {
            // если после изменения файл не выбран, то сообщаем об этом пользователю
            $(e.currentTarget).next('p').text('* Файл не будет отправлен, т.к. он не выбран');
        }
    };

    /*
     Параметры указываются в виде:
     {
     ключ: значение;
     ключ: значение;
     ...
     }
     idForm - id формы обратной связи (по умолчанию feedbackForm)
     idCaptcha - идентификатор капчи
     existenceUploadsFile - наличие у формы блока загрузки файлов (по умолчанию true)
     countFiles - количество файлов для загрузки (по умолчанию 5)
     maxSizeFile - максиальный размер файла в байтах (по умолчанию 524288 байт)
     validFileExtensions - допустимые расширения файлов (по умолчанию 'jpg','jpeg','bmp','gif','png')
     existenceCaptcha - наличие у формы капчи (по умолчанию true)
     hideForm - скрыть форму после отправки данных
     agreeCheckbox - флажок о принятии пользовательского соглашения перед отправкой формы (по умолчанию true)

     */
    var formFeedback = new ProcessForm({idForm: 'messageForm', idCaptcha: recaptcha1});
    formFeedback.init();

    //var contactForm = new ProcessForm({ idForm: 'contactForm', existenceUploadsFile: false, existenceCaptcha: false });
    //contactForm.init();

});